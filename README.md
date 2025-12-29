# 🌱 AI-Driven LCA Tool for Sustainable Metallurgy

🚀 **Smart India Hackathon 2025 (SIH25069)**  
AI-powered Life Cycle Assessment (LCA) platform for the mining and metallurgy industry, focused on environmental sustainability and circular economy.

---

## 🎯 Problem Statement
Traditional LCA in metallurgy is:
- Time-consuming
- Manual
- Error-prone

There is no smart AI-based system to quickly evaluate carbon emissions, energy use, and water consumption while suggesting sustainable alternatives.

---

## 💡 Solution
This project provides an AI-driven LCA platform that:
- Analyzes environmental impact of metals
- Uses ML for accurate predictions
- Recommends optimal sustainable choices
- Supports batch analysis using CSV files

---

## 🛠️ Tech Stack

### Frontend
- React 18 + TypeScript
- Vite
- Tailwind CSS
- Framer Motion
- Recharts
- Zustand
- React Hook Form

### Backend
- Node.js
- Express.js
- MongoDB (Mongoose)
- Multer
- PDFKit

### Machine Learning
- Python
- scikit-learn (Random Forest)
- pandas, numpy
- joblib

---

## 🚀 Features
- AI-powered LCA analysis
- Individual & CSV batch processing
- Smart AI assistant (auto-fills missing data)
- CO₂, energy & water usage calculation
- Circularity & recycling assessment
- PDF report generation
- Results comparison
- Mobile-responsive UI

---

## 📁 Project Structure
```
NueraNova-main/
├── src/
├── backEnd/
│ ├── controllers/
│ ├── routes/
│ ├── models/
│ └── ml/
├── public/
├── package.json
├── vite.config.ts
└── README.md
```
 ---

## 🛣️ API Endpoints
```
POST /api/analyze
POST /api/csv/upload
POST /api/ai/smart-fill
GET /api/results
GET /api/report/:id
```
 
---

## ⚙️ Installation & Setup

### Prerequisites
- Node.js 18+
- Python 3.8+
- MongoDB

### Frontend
```bash
npm install
npm run dev
```

### Backend
```
cd backEnd
npm install
pip install -r ml/requirements.txt
npm run dev
```

🌍 Impact
```
Supports green metallurgy
Encourages circular economy
Reduces industrial carbon footprint

🏆 Hackathon Details
Hackathon: Smart India Hackathon 2025
Problem ID: SIH25069
Organization: Ministry of Mines
Theme: Metallurgy & Circular Economy

🔮 Future Enhancements
IoT sensor integration
Advanced dashboards
Blockchain traceability
Multi-language support

👨‍💻 Team
Developed as part of Smart India Hackathon 2025
