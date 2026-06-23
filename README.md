# 📦 Asset Management System

> Full-stack inventory and asset management system for educational institutions and organizations

[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-12+-blue.svg)](https://www.postgresql.org/)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

![Dashboard Preview](https://via.placeholder.com/800x400/1E293B/FFFFFF?text=AMS-SMK+Dashboard)

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Quick Start](#-quick-start)
- [Installation](#-installation)
- [Usage](#-usage)
- [API Documentation](#-api-documentation)
- [Project Structure](#-project-structure)
- [Screenshots](#-screenshots)
- [Troubleshooting](#-troubleshooting)
- [Contributing](#-contributing)
- [License](#-license)

---

## ✨ Features

### Core Functionality
- 🔐 **JWT Authentication** - Secure login system
- 📦 **Inventory Management** - Full CRUD operations for asset tracking
- 🔄 **Loan Tracking** - Sistem peminjaman dan pengembalian barang
- 📊 **Consumables Monitoring** - Tracking barang habis pakai dengan alert low stock
- 📈 **Real-time Dashboard** - Metrics dan activity monitoring
- 🔍 **Advanced Search & Filter** - Quick find untuk semua data
- 📱 **Responsive Design** - Works on desktop dan mobile

### Technical Features
- ⚡ REST API with 30+ endpoints
- 🗄️ PostgreSQL database dengan relational schema
- 🔒 Secure password hashing (bcrypt)
- 📝 Activity logging untuk audit trail
- 🎨 Modern UI dengan Tailwind CSS
- 🚀 Fast performance (< 100ms avg response time)

---

## 🛠️ Tech Stack

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: PostgreSQL 12+
- **Authentication**: JWT (jsonwebtoken)
- **Security**: bcryptjs, cors
- **Validation**: express-validator

### Frontend
- **Framework**: Vanilla JavaScript (ES6+)
- **Styling**: Tailwind CSS 3.x
- **Icons**: Material Symbols
- **Fonts**: Google Fonts (Geist, Inter)

### DevOps
- **Process Manager**: nodemon (development)
- **Version Control**: Git
- **Deployment**: Docker (optional)

---

## 🚀 Quick Start

### 🐳 Docker Deployment (Recommended)

**Prerequisites**: Docker & Docker Compose

```bash
# Clone repository
git clone https://github.com/ReihanZanuar/Asset-Management-System-V2.git
cd ams-smk

# Start all services with one command
docker-compose up -d
```

**Access Application**:
- **URL**: http://localhost
- **Default Login**: `admin` / `admin123`

That's it! Database, backend, and frontend are all running in containers.

---

### 💻 Manual Installation (Alternative)

**Prerequisites**: Node.js 18+, PostgreSQL 12+

```bash
# Install backend dependencies
cd server
npm install

# Setup database
npm run db:setup

# Start backend server
npm run dev
```

```bash
# In new terminal, serve frontend
cd client
python3 -m http.server 8080
```

**Access Application**:
- **Frontend**: http://localhost:8080
- **Backend API**: http://localhost:5000
- **Default Login**: `admin` / `admin123`

---

## 📦 Installation

### Step 1: Clone & Install

```bash
git clone https://github.com/ReihanZanuar/Asset-Management-System-V2.git
cd ams-smk/server
npm install
```

### Step 2: Configure Environment

```bash
# Copy environment template
cp .env.example .env

# Edit .env file
nano .env
```

**Required Environment Variables:**
```env
# Server
PORT=5000
NODE_ENV=development

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=ams_smk_db
DB_USER=postgres
DB_PASSWORD=your_password

# JWT
JWT_SECRET=your-super-secret-key-change-this
JWT_EXPIRES_IN=7d

# CORS
CORS_ORIGIN=http://localhost:8080
```

### Step 3: Setup Database

```bash
# Initialize database and seed data
npm run db:setup
```

This will:
- Create `ams_smk_db` database
- Create all tables with proper relationships
- Seed sample data (15 inventory items, 6 consumables, 2 loans)
- Create default admin user

### Step 4: Start Application

```bash
# Development mode (auto-reload)
npm run dev

# Production mode
npm start
```

### Step 5: Serve Frontend

```bash
cd ../client

# Option 1: Python
python3 -m http.server 8080

# Option 2: Node.js
npx http-server -p 8080

# Option 3: PHP
php -S localhost:8080
```

---

## 🎯 Usage

### Authentication

#### Login
```
URL: http://localhost:8080/login.html
Default Credentials:
  Username: admin
  Password: admin123
```

### Main Features

#### 1. Dashboard
- View real-time metrics (total assets, low stock, active loans)
- Monitor recent activity
- Quick overview of lab status

#### 2. Inventory Management
- Add new equipment with details (code, name, category, specs)
- Edit existing items
- Delete items (with confirmation)
- Search by name or code
- Filter by category and condition

#### 3. Loan Management
- Create new loan (select item, borrower info, due date)
- Track active loans
- Return items with condition assessment
- View overdue loans
- Search by borrower or item

#### 4. Consumables Management
- Add consumable items (name, quantity, unit, threshold)
- Update stock levels
- Automatic low stock alerts
- Track location and notes

---

## 📚 API Documentation

### Base URL
```
http://localhost:5000/api
```

### Authentication

All endpoints (except `/auth/login` and `/auth/register`) require JWT token:

```http
Authorization: Bearer <your_jwt_token>
```

### Endpoints Overview

#### Authentication
```http
POST   /api/auth/register     - Register new user
POST   /api/auth/login        - Login user
GET    /api/auth/profile      - Get current user profile
```

#### Inventory
```http
GET    /api/inventory         - Get all inventory items
GET    /api/inventory/stats   - Get inventory statistics
GET    /api/inventory/:id     - Get single item
POST   /api/inventory         - Create new item
PUT    /api/inventory/:id     - Update item
DELETE /api/inventory/:id     - Delete item
```

#### Loans
```http
GET    /api/loans             - Get all loans
GET    /api/loans/active      - Get active loans
GET    /api/loans/overdue     - Get overdue loans
POST   /api/loans             - Create new loan
PUT    /api/loans/:id/return  - Mark loan as returned
```

#### Consumables
```http
GET    /api/consumables           - Get all consumables
GET    /api/consumables/low-stock - Get low stock items
POST   /api/consumables           - Create consumable
PUT    /api/consumables/:id       - Update consumable
DELETE /api/consumables/:id       - Delete consumable
```

#### Analytics
```http
GET    /api/analytics/dashboard   - Get dashboard metrics
GET    /api/analytics/reports     - Get detailed reports
```

### Example Request

```bash
# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# Get inventory (with token)
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:5000/api/inventory
```

**Full API documentation**: See [API_DOCS.md](docs/API_DOCS.md)

---

## 📁 Project Structure

```
ams-smk/
├── server/                      # Backend application
│   ├── config/
│   │   └── database.js          # PostgreSQL configuration
│   ├── controllers/             # Business logic
│   │   ├── authController.js
│   │   ├── inventoryController.js
│   │   ├── loansController.js
│   │   ├── consumablesController.js
│   │   ├── cannibalizationController.js
│   │   └── analyticsController.js
│   ├── middleware/
│   │   └── auth.js              # JWT authentication
│   ├── routes/                  # API routes
│   │   ├── auth.js
│   │   ├── inventory.js
│   │   ├── loans.js
│   │   ├── consumables.js
│   │   ├── cannibalization.js
│   │   └── analytics.js
│   ├── scripts/
│   │   └── setupDatabase.js     # Database setup script
│   ├── index.js                 # Main server file
│   ├── package.json
│   ├── .env                     # Environment variables
│   └── .env.example             # Environment template
│
├── client/                      # Frontend application
│   ├── js/
│   │   ├── api.js               # API service layer
│   │   └── utils.js             # Utility functions
│   ├── login.html               # Login page
│   ├── dashboard.html           # Dashboard
│   ├── inventory.html           # Inventory management
│   ├── loans.html               # Loan management
│   └── consumables.html         # Consumables management
│
├── database/
│   ├── schema.sql               # Database schema
│   └── seed.sql                 # Sample data
│
├── docs/                        # Documentation
│   ├── API_DOCS.md
│   ├── TROUBLESHOOTING.md
│   └── USAGE_REPORT.md
│
├── README.md
└── LICENSE
```

---

## 📸 Screenshots

### Dashboard
![Dashboard](https://via.placeholder.com/800x500/0F172A/FFFFFF?text=Real-time+Dashboard)

### Inventory Management
![Inventory](https://via.placeholder.com/800x500/0F172A/FFFFFF?text=Inventory+CRUD)

### Loan Tracking
![Loans](https://via.placeholder.com/800x500/0F172A/FFFFFF?text=Loan+Management)

---

## 🐛 Troubleshooting

### Common Issues

#### Backend won't start
```bash
# Check if port 5000 is already in use
lsof -i :5000
kill -9 <PID>

# Or change port in .env
PORT=5001
```

#### Database connection error
```bash
# Verify PostgreSQL is running
pg_isready

# Check credentials in .env
# Re-run database setup
npm run db:setup
```

#### Frontend can't connect to API
- Ensure backend is running (http://localhost:5000/health)
- Check CORS settings in `.env`
- Verify API_BASE_URL in `client/js/api.js`

**Full troubleshooting guide**: See [TROUBLESHOOTING.md](TROUBLESHOOTING.md)

---

## 🧪 Testing

```bash
# Run tests (if configured)
npm test

# Manual API testing
curl http://localhost:5000/health

# Database integrity check
psql -U postgres -d ams_smk_db -c "SELECT COUNT(*) FROM inventory;"
```

---

## 🚢 Deployment

### 🐳 Docker Deployment (Recommended)

**Start all services:**
```bash
docker-compose up -d
```

**View logs:**
```bash
docker-compose logs -f
```

**Stop services:**
```bash
docker-compose down
```

**Architecture:**
- 🗄️ PostgreSQL database (port 5432)
- 🔧 Node.js API backend (port 5000)
- 🌐 Nginx frontend (port 80)
- 🔗 Automatic networking between containers
- 💾 Persistent database volume

**Access**: http://localhost

**See full Docker guide**: [DOCKER_QUICKSTART.md](DOCKER_QUICKSTART.md)

---

### 💻 Traditional Deployment

1. **Setup production environment**
2. **Configure environment variables**
3. **Run database migrations**
4. **Start with PM2 or systemd**

```bash
# Using PM2
npm install -g pm2
pm2 start server/index.js --name ams-smk
pm2 save
```

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

### Development Guidelines
- Follow existing code style
- Write meaningful commit messages
- Add tests for new features
- Update documentation

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👥 Authors

- **Reihan Zanuar** - *Initial work* - [GitHub](https://github.com/ReihanZanuar)

---

## 🙏 Acknowledgments

- Built for educational and organizational asset management
- Inspired by modern inventory systems
- Uses Material Design principles

---

## 📞 Support

- **Documentation**: [docs/](docs/)
- **Issues**: [GitHub Issues](https://github.com/ReihanZanuar/Asset-Management-System-V2/issues)
- **Email**: your.email@example.com

---

## 🔮 Roadmap

### Version 1.1 (Coming Soon)
- [ ] Export to Excel/PDF
- [ ] Email notifications for overdue loans
- [ ] Barcode/QR code scanning
- [ ] Advanced analytics charts

### Version 2.0 (Future)
- [ ] Mobile app (React Native)
- [ ] Multi-lab support
- [ ] Role-based access control (RBAC)
- [ ] Automated inventory audits

---

<div align="center">

**⭐ Star this repo if you find it helpful!**

Made with ❤️ for efficient asset management

</div>
