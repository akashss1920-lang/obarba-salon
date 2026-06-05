# 🌟 O'BARBA Salon — Backend Setup Guide

## 📁 Final Folder Structure

```
obarba-salon/              ← Aapka GitHub repo
├── index.html             ← Website (update karni hai)
├── admin/
│   └── index.html         ← Admin Dashboard ✅ (NEW)
├── backend/
│   ├── server.js          ← Main server ✅ (NEW)
│   ├── package.json       ✅ (NEW)
│   ├── .env.example       ✅ (NEW)
│   ├── .gitignore         ✅ (NEW)
│   └── .env               ← KHUD BANANA HAI (secret!)
├── data.json
├── logo.png
└── meriphoto*.jpg
```

---

## 🚀 STEP BY STEP SETUP (Order mein karo!)

---

### STEP 1 — MongoDB Atlas Setup (Database)

1. **mongodb.com** pe jaao → Free account banao
2. **"Create Cluster"** → Free tier (M0) select karo
3. **Database User** banao:
   - Username: `obarba`
   - Password: koi bhi strong password
4. **Network Access** mein `0.0.0.0/0` add karo (sabko allow)
5. **Connect** → "Drivers" → Connection string copy karo:
   ```
   mongodb+srv://obarba:PASSWORD@cluster0.xxxxx.mongodb.net/obarba
   ```

---

### STEP 2 — WhatsApp Alert Setup (CallMeBot - FREE)

1. Apne WhatsApp se **+34 644 59 95 85** pe message karo
2. Ye message bhejo (exactly):
   ```
   I allow callmebot to send me messages
   ```
3. Reply mein aayega: `API Approved! Your APIKEY is: XXXXXXXX`
4. Wo API key save kar lo

---

### STEP 3 — Backend Files GitHub pe Upload karo

Ye files apne GitHub repo mein add karo:

```bash
# Apna repo clone karo (already hai toh skip)
git clone https://github.com/akashss1920-lang/obarba-salon.git
cd obarba-salon

# Backend files copy karo (is README ke saath diye gaye files)
# admin/index.html → admin/index.html
# backend/ folder → backend/

git add .
git commit -m "Add backend + admin dashboard"
git push origin main
```

---

### STEP 4 — Render.com pe Deploy karo (FREE Hosting)

1. **render.com** pe free account banao (GitHub se login karo)
2. **"New" → "Web Service"** click karo
3. **GitHub repo** connect: `akashss1920-lang/obarba-salon`
4. Settings fill karo:

   | Field | Value |
   |-------|-------|
   | Name | `obarba-backend` |
   | Root Directory | `backend` |
   | Runtime | `Node` |
   | Build Command | `npm install` |
   | Start Command | `npm start` |
   | Instance Type | `Free` |

5. **Environment Variables** add karo:

   | Key | Value |
   |-----|-------|
   | `MONGODB_URI` | `mongodb+srv://obarba:PASSWORD@...` |
   | `ADMIN_PASSWORD` | `obarba@admin2024` |
   | `WHATSAPP_PHONE` | `919XXXXXXXXX` (apna number) |
   | `WHATSAPP_API_KEY` | CallMeBot se mila key |
   | `FRONTEND_URL` | `https://obarbafamilysalon.com` |

6. **"Create Web Service"** click karo
7. Deploy hone ka wait karo (~2-3 min)
8. Aapko milega: `https://obarba-backend.onrender.com` ✅

---

### STEP 5 — Frontend (index.html) Update karo

`index.html` mein apna purana `handleBooking` function dhundho aur replace karo.

**Dhundhne ke liye:** `Ctrl+F` → search karo `handleBooking`

Replacement code `FRONTEND_UPDATE.html` file mein hai.

Ek line update karo:
```javascript
// Ye line update karo apne Render URL se:
const BACKEND_URL = 'https://obarba-backend.onrender.com';
```

---

### STEP 6 — Admin Dashboard Access karo

Deploy hone ke baad:
- Admin Panel: `https://obarbafamilysalon.com/admin/`
- Password: Jo aapne `.env` mein set kiya (`ADMIN_PASSWORD`)

---

## ✅ Test Karo

1. Website pe jaao: `https://obarbafamilysalon.com`
2. Booking form fill karo
3. Submit karo
4. **WhatsApp pe notification aayega** 📱
5. Admin panel check karo: booking wahan dikhegi 📊

---

## ⚠️ Important Notes

- `.env` file **kabhi GitHub pe push mat karo** (secret hai!)
- Free Render server pehli request pe thoda slow hota hai (cold start)
- MongoDB Atlas free tier mein 512MB storage hai — kaafi hai!
- CallMeBot se din mein ~150 free messages milte hain

---

## 📞 Support

Koi problem aaye toh in cheezein check karo:
1. MongoDB URI sahi hai?
2. Network access `0.0.0.0/0` set hai?
3. WhatsApp pe CallMeBot ko allow kiya?
4. Render pe sab environment variables set hain?
