# 🚀 Deployment Guide - Pawsistente Alpha

This guide covers deploying the Pawsistente application in its current alpha state.

## ⚠️ Alpha Release Notice

This is an **ALPHA VERSION** of Pawsistente. It may contain bugs and incomplete features. Use at your own risk.

## 📋 Prerequisites

- Node.js 18+ 
- npm or yarn
- A web server or hosting platform

## 🗂️ Data Source

The application now reads event data from CSV files instead of MongoDB:
- `static/schedule_spanish.csv` - Spanish events (fallback)
- `static/schedule_english.csv` - English events

## 🚀 Deployment Options

### Option 1: Static Hosting (Recommended)

The app can be deployed as a static site to platforms like:
- Vercel
- Netlify
- GitHub Pages
- Cloudflare Pages

1. **Build the application:**
   ```bash
   npm run build
   ```

2. **Deploy the `build/` directory** to your static hosting platform.

3. **Ensure CSV files are accessible** at `/schedule_spanish.csv` and `/schedule_english.csv`.

### Option 2: Docker Deployment

1. **Build the Docker image:**
   ```bash
   docker-compose build
   ```

2. **Run the application:**
   ```bash
   docker-compose up -d
   ```

3. **Access the app** at `http://localhost:3000`

### Option 3: Traditional Server

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Build the application:**
   ```bash
   npm run build
   ```

3. **Start the server:**
   ```bash
   npm start
   ```

## 📁 Required Files

Ensure these files are present in your deployment:
- `static/schedule_spanish.csv` - Spanish event schedule
- `static/schedule_english.csv` - English event schedule (optional)
- All built assets in `build/` directory

## 🔧 Environment Variables

No environment variables are required for the alpha version.

## 🐛 Known Issues (Alpha)

- CSV parsing may fail with malformed data
- Conflict detection might not work perfectly with all time formats
- Some translations may be missing
- Performance may be slow with large CSV files

## 📝 CSV Format

The CSV files should have these columns:
```
day,start_time,end_time,location,title,hosted_by,category,description
```

Example:
```
thursday,14:00,15:00,Main Hall,Workshop,John Doe,Educational,Learn something new
```

## 🆘 Troubleshooting

1. **Events not loading:** Check that CSV files are accessible and properly formatted
2. **Conflicts not showing:** Ensure selectedEvents are passed to EventCard component
3. **Language switching not working:** Verify CSV files exist for both languages

## 📞 Support

For issues with this alpha version, please contact the development team.

---

**Remember:** This is an alpha release. Features may change or be removed without notice.
