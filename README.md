# Nafasat Fashion & Rentals — Digital Showroom & Admin Portal

An in-store tablet showroom and web catalogue for **Nafasat Fashion & Rentals** (*"The store for rental dresses and accessories"*), featuring intelligent mannequin dummy framing, multi-criteria filtering, full-angle lightboxes, customer try-on shortlists, and a password-protected staff admin portal for uploading new outfits.

---

## 🌟 Key Features

1. **Intelligent Mannequin / Dummy Photo Framing**:
   - Every product card displays the full-length mannequin dress (`object-position: top center; aspect-ratio: 2 / 3;`) ensuring the neckline and embroidery are never cut off.
   - Tap any card to open the fullscreen lightbox showing all detail angles, close-up embroidery, and tag photos.

2. **Multi-Criteria Filtering & Search**:
   - **Categories**: Bridal Wear, Party Wear, Girls Rental, Boys Coat-Pants, Sarees, Clutches & Purses, Footwear, Boys Sherwani.
   - **Color Filter**: Filter by curated color buckets (Red & Maroon, Pink & Peach, Blue & Ferozi, Green & Emerald, Gold & Yellow, White & Silver, Black, Purple & Plum, Multi & Other).
   - **Size Filter**: XS, Small, Medium, Large, XL, Kids, Free Size.
   - **Live Search**: Instant SKU code or keyword searching.

3. **Customer Try-On List**:
   - Customers and shop assistants can shortlist dresses with a single tap.
   - Export list directly to WhatsApp with pre-filled SKU codes and rental prices.

4. **Staff Admin Portal (`/admin`)**:
   - Password-protected manager dashboard.
   - **Add New Outfit**:
     - Dedicated dropzone for **Primary Dummy / Mannequin Photo** (shown on catalogue front).
     - Multi-file dropzone for **Additional Angles & Details**.
     - Auto-categorization and smart color/size bucket suggestions.
     - Live upload progress bar.
   - **Manage Inventory**:
     - Search and filter all outfits.
     - Direct "View in Showroom" link.
     - Instant outfit deletion with confirmation safeguard.

---

## 🚀 Running Locally on macOS (In Shop)

### 1. Install Dependencies
Open Terminal in the project directory:
```bash
cd /Users/kfatima/Documents/Nafasat/nafasat-catalogue-web
pip3 install -r requirements.txt
```

### 2. Start the Server
```bash
python3 app.py
```

### 3. Open in Browser or Tablet
- **Customer Showroom**: [http://localhost:8080](http://localhost:8080)
- **Staff Admin Portal**: [http://localhost:8080/admin](http://localhost:8080/admin)
  - **Default Username**: `admin`
  - **Default Password**: `nafasat2026!`

---

## ☁️ Deploying to Render (Free Web Service)

This application is ready to deploy directly on **Render's Free Web Service tier**.

### Step 1: Push Project to GitHub
Initialize git and push the folder to your GitHub repository:
```bash
cd /Users/kfatima/Documents/Nafasat/nafasat-catalogue-web
git init
git add .
git commit -m "Nafasat Catalogue Web with Admin Portal"
git branch -M main
git remote add origin https://github.com/<YOUR_GITHUB_USERNAME>/nafasat-catalogue.git
git push -u origin main
```

### Step 2: Create Web Service on Render
1. Log in to [dashboard.render.com](https://dashboard.render.com).
2. Click **New +** -> **Web Service**.
3. Connect your **`nafasat-catalogue`** GitHub repository.
4. Render will auto-detect the configuration, or enter the following settings:
   - **Name**: `nafasat-catalogue`
   - **Region**: Any (e.g. *Frankfurt* or *Oregon*)
   - **Runtime**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `gunicorn app:app --workers 2 --threads 4 --timeout 120`
   - **Plan**: `Free`
5. In **Environment Variables**, configure your admin credentials:
   - `ADMIN_USERNAME` = `admin`
   - `ADMIN_PASSWORD` = `<YOUR_CHOSEN_SECURE_PASSWORD>`
   - `SECRET_KEY` = `<RANDOM_SECRET_STRING>`
6. Click **Deploy Web Service**.

Within 2 minutes, your catalogue will be live at:
`https://nafasat-catalogue.onrender.com`

---

## 📁 Project Architecture

```
nafasat-catalogue-web/
├── app.py                   # Python Flask web service & admin API
├── requirements.txt         # Dependencies (Flask, Gunicorn, Werkzeug)
├── render.yaml              # Render blueprint deployment file
├── index.html               # Customer-facing digital showroom
├── admin.html               # Staff admin portal & outfit uploader
├── css/
│   └── style.css            # Responsive styles & brand palette (#F8C843, #222222)
├── js/
│   ├── app.js               # Client catalogue engine & try-on wishlist
│   └── admin.js             # Admin login, dropzones, & inventory manager
├── data/
│   └── products.json        # Atomic JSON database of outfits & categories
├── assets/
│   ├── logo.png             # Authentic Nafasat brand calligraphy logo
│   └── images/              # Category outfit folders (dummy & detail photos)
└── scripts/
    └── build_catalog.py     # Batch catalog builder from raw excel / photo folders
```

---

© 2026 Nafasat Fashion & Rentals. All rights reserved.
