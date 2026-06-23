# 🐳 Docker Quick Start Guide

> **Complete tutorial untuk menjalankan Asset Management System dengan Docker**  
> Untuk pengguna yang baru pertama kali menggunakan aplikasi ini.

---

## 📋 Prerequisites (Yang Harus Disiapkan)

Sebelum memulai, pastikan sudah terinstall:

### 1. Docker & Docker Compose

**Cek apakah sudah terinstall:**
```bash
docker --version
docker-compose --version
```

**Jika belum terinstall:**

- **Windows/Mac**: Download [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- **Linux (Ubuntu/Debian)**:
  ```bash
  sudo apt update
  sudo apt install docker.io docker-compose
  sudo systemctl start docker
  sudo usermod -aG docker $USER  # Run Docker without sudo
  ```

### 2. Git (Optional, tapi recommended)

```bash
git --version
```

Jika belum ada: [Download Git](https://git-scm.com/downloads)

---

## 🚀 Step-by-Step Installation

### Step 1: Download Project dari GitHub

#### Option A: Menggunakan Git Clone (Recommended)

```bash
# Clone repository
git clone https://github.com/ReihanZanuar/Asset-Management-System-V2.git

# Masuk ke folder project
cd YOUR_REPO_NAME
```

#### Option B: Download ZIP Manual

1. Buka halaman GitHub repository
2. Klik tombol hijau **"Code"**
3. Pilih **"Download ZIP"**
4. Extract file ZIP ke folder yang diinginkan
5. Buka terminal/command prompt, navigate ke folder tersebut:
   ```bash
   cd path/to/extracted/folder
   ```

---

### Step 2: Verify Project Structure

Pastikan struktur folder seperti ini:

```
ams-smk-app/
├── client/              # Frontend files
├── server/              # Backend files
├── database/            # Database schema
├── docker-compose.yml   # Docker configuration
├── nginx.conf           # Web server config
└── README.md
```

Cek dengan command:
```bash
ls -la
```

---

### Step 3: Start Docker Containers

**Jalankan semua services dengan satu command:**

```bash
docker-compose up -d
```

**Penjelasan:**
- `docker-compose up`: Start containers
- `-d`: Detached mode (run in background)

**Proses yang terjadi:**
1. ✅ Docker akan download images yang diperlukan (PostgreSQL, Node.js, Nginx)
2. ✅ Build backend application
3. ✅ Setup database dengan schema dan sample data
4. ✅ Start 3 containers:
   - PostgreSQL database (port 5432)
   - Node.js backend API (port 5000)
   - Nginx frontend (port 80)

**Tunggu hingga selesai** (~2-5 menit pertama kali, tergantung internet speed)

---

### Step 4: Verify Containers Running

```bash
docker-compose ps
```

**Output yang benar:**
```
NAME           IMAGE                   STATUS
ams-smk-db     postgres:15-alpine      Up (healthy)
ams-smk-api    ams-smk-app-backend     Up (healthy)
ams-smk-web    nginx:alpine            Up
```

Semua containers harus **"Up"** atau **"Up (healthy)"**

---

### Step 5: Access Application

**Buka browser dan akses:**

🌐 **URL**: http://localhost

**Default Login Credentials:**
- **Username**: `admin`
- **Password**: `admin123`

---

## ✅ Quick Test

Setelah login, test fitur-fitur utama:

1. ✅ **Dashboard**: Lihat metrics dan statistics
2. ✅ **Inventory**: Tambah item baru dengan foto
3. ✅ **Loans**: Buat peminjaman barang
4. ✅ **Consumables**: Monitor barang habis pakai
5. ✅ **Analytics**: Lihat grafik dan reports

---

## 📊 Container Management

### View Logs (Untuk Debug)

```bash
# Semua logs
docker-compose logs -f

# Logs specific service
docker-compose logs -f backend
docker-compose logs -f database
docker-compose logs -f frontend
```

**Keluar dari logs**: Tekan `Ctrl + C`

---

### Stop Application

```bash
# Stop semua containers (data tetap tersimpan)
docker-compose down
```

---

### Restart Application

```bash
# Stop dan start ulang
docker-compose restart

# Atau stop kemudian start
docker-compose down
docker-compose up -d
```

---

### Reset Database (CAUTION: Data Akan Hilang!)

```bash
# Stop dan hapus semua data
docker-compose down -v

# Start ulang (akan create database baru dengan sample data)
docker-compose up -d
```

---

## 🔍 Troubleshooting

### Problem 1: Port Already in Use

**Error**: `Bind for 0.0.0.0:80 failed: port is already allocated`

**Solution**:
```bash
# Cek aplikasi yang menggunakan port 80
sudo lsof -i :80  # Mac/Linux
netstat -ano | findstr :80  # Windows

# Stop aplikasi tersebut, atau edit docker-compose.yml:
# Ubah port frontend dari "80:80" menjadi "8080:80"
# Akses via http://localhost:8080
```

---

### Problem 2: Containers Not Healthy

**Cek status:**
```bash
docker-compose ps
```

**Cek logs untuk error:**
```bash
docker-compose logs backend
docker-compose logs database
```

**Solution**:
```bash
# Restart containers
docker-compose restart

# Jika masih error, recreate containers
docker-compose down
docker-compose up -d --force-recreate
```

---

### Problem 3: Cannot Connect to Database

**Symptoms**: Backend logs show "connection refused" atau "password authentication failed"

**Solution**:
```bash
# Database mungkin belum ready, tunggu 10-20 detik
# Cek database logs
docker-compose logs database

# Jika perlu, restart backend setelah database ready
docker-compose restart backend
```

---

### Problem 4: Frontend Shows "Cannot connect to API"

**Check**:
1. Pastikan backend running: http://localhost:5000/health
2. Cek browser console (F12) untuk error details
3. Clear browser cache dan reload (Ctrl + Shift + R)

**Solution**:
```bash
# Restart backend
docker-compose restart backend
```

---

## 🛠️ Advanced Commands

### Access Database Directly

```bash
# Connect ke PostgreSQL database
docker exec -it ams-smk-db psql -U postgres -d ams_smk_db

# Common queries:
\dt                    # List tables
SELECT * FROM users;   # View users
SELECT * FROM inventory;
\q                     # Exit
```

---

### View Container Details

```bash
# Container information
docker inspect ams-smk-api

# Resource usage
docker stats

# Execute command inside container
docker exec -it ams-smk-api sh
```

---

### Update Application

Jika ada update di GitHub:

```bash
# Pull latest changes
git pull origin main

# Rebuild dan restart containers
docker-compose down
docker-compose up -d --build
```

---

## 📦 What Gets Deployed

| Service | Container Name | Port | Description |
|---------|---------------|------|-------------|
| **PostgreSQL** | ams-smk-db | 5432 | Database server |
| **Backend API** | ams-smk-api | 5000 | Node.js Express API |
| **Frontend** | ams-smk-web | 80 | Nginx web server |

**Networking**: Containers communicate via Docker internal network

**Data Persistence**: Database data stored in Docker volume (persistent across restarts)

---

## 🔒 Security Notes

### Change Default Password!

Setelah first login, **WAJIB ganti password default:**

1. Login sebagai admin
2. Buka profile settings
3. Change password dari `admin123` ke password yang strong

### Environment Variables

File `.env` di folder `server/` contains sensitive data:
- Database passwords
- JWT secret keys

**JANGAN commit file `.env` ke GitHub!** (sudah di-protect oleh .gitignore)

---

## 📞 Getting Help

### Check Documentation

- **README.md**: Feature overview & manual installation
- **TROUBLESHOOTING.md**: Detailed error solutions
- **API Documentation**: API endpoints reference

### Common Issues

| Issue | Solution |
|-------|----------|
| Port already in use | Change port in docker-compose.yml |
| Database connection failed | Wait 20s for DB to be ready, then restart backend |
| Cannot login | Check backend logs, verify database seeded |
| Slow performance | Increase Docker resources in Docker Desktop settings |

### Still Need Help?

1. Check container logs: `docker-compose logs -f`
2. View GitHub Issues: [Link to repo issues]
3. Contact: [Your support channel]

---

## 🎯 Next Steps

After successful setup:

1. ✅ **Explore Features**: Try all modules (inventory, loans, consumables)
2. ✅ **Add Real Data**: Replace sample data dengan data organisasi Anda
3. ✅ **Customize**: Ubah branding, colors sesuai kebutuhan
4. ✅ **Backup**: Setup regular database backups
5. ✅ **Production**: Deploy ke server production (VPS, cloud)

---

## 📚 Quick Reference

```bash
# Start
docker-compose up -d

# Stop
docker-compose down

# View logs
docker-compose logs -f

# Restart
docker-compose restart

# Update
git pull && docker-compose up -d --build

# Reset database
docker-compose down -v && docker-compose up -d
```

---

**🎉 Selamat! Asset Management System sudah running!**

Access: http://localhost  
Login: admin / admin123

---

*Last Updated: 2026-06-23*  
*For detailed documentation, see README.md*
