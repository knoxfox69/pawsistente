# 📁 CSV File Management - External Mounting

## ✅ **CSV Files Now Mounted Externally**

Both CSV files are now mounted from outside the container, making them easy to update without rebuilding:

### 📊 **Files Mounted:**

1. **`static/access_codes.csv`** - Beta access codes and device limits
2. **`static/schedule.csv`** - Application schedule/events

### 🔧 **How It Works:**

The deploy script now mounts these files as **read-only volumes**:
```bash
-v "$(pwd)/static/access_codes.csv:/app/static/access_codes.csv:ro"
-v "$(pwd)/static/schedule.csv:/app/static/schedule.csv:ro"
```

## 🚀 **Updating CSV Files:**

### **Method 1: Helper Script (Recommended)**
```bash
npm run csv:edit
# or
./scripts/update-csv.sh
```

This interactive script will:
- Show current file contents
- Open editor (nano/vi)
- Restart container automatically
- Confirm changes are applied

### **Method 2: Manual Editing**
```bash
# Edit the files directly
nano static/access_codes.csv
nano static/schedule.csv

# Restart container to apply changes
docker restart pawsistente-prod
```

### **Method 3: Replace Files**
```bash
# Replace with new files
cp new_access_codes.csv static/access_codes.csv
cp new_schedule.csv static/schedule.csv

# Restart container
docker restart pawsistente-prod
```

## 📋 **File Formats:**

### **Access Codes (`access_codes.csv`):**
```csv
code,max_devices,description
test123,3,Sample beta access code
betafuror,10,Special beta access
```

### **Schedule (`schedule.csv`):**
```csv
date,time,event,description
2025-10-20,15:00,Launch,Main application launch
2025-11-01,10:00,Update,New features release
```

## 🎯 **Benefits:**

1. **No Rebuild Required** - Changes take effect immediately after container restart
2. **Easy Editing** - Files are on the host system, not inside container
3. **Version Control** - CSV files can be tracked in git
4. **Backup Friendly** - Easy to backup and restore CSV files
5. **Hot Updates** - Just restart container to apply changes

## 🔄 **Update Workflow:**

1. **Edit CSV files** on host system
2. **Restart container**: `docker restart pawsistente-prod`
3. **Changes are live** immediately

## 📁 **File Locations:**

```
/home/knox/Workspace/Coding/pawsistente/
├── static/
│   ├── access_codes.csv    ← Beta access codes
│   └── schedule.csv        ← Application schedule
└── scripts/
    ├── deploy.sh           ← Main deployment script
    └── update-csv.sh       ← CSV management helper
```

## ✅ **Verification:**

Check that files are mounted correctly:
```bash
docker exec pawsistente-prod ls -la /app/static/ | grep csv
```

Should show:
```
-rw-r--r-- 1 sveltekit 998 189 Oct 17 21:20 access_codes.csv
-rw-r--r-- 1 sveltekit 998 2552 Oct 18 00:43 schedule.csv
```

## 🎉 **Success!**

Your CSV files are now:
- ✅ **Externally mounted** from host
- ✅ **Easy to update** without rebuilding
- ✅ **Version controlled** and backup-friendly
- ✅ **Hot-swappable** with container restart

**No more rebuilds needed for CSV changes!** 🚀
