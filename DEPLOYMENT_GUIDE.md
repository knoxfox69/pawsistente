# 🚀 Single Deploy Script - Complete Setup

## ✅ **Perfect! You now have ONE script that deploys everything:**

### **🎯 Single Command Deployment:**

```bash
./scripts/deploy.sh
```

**That's it!** This single script will:
- ✅ Build the production Docker image (ARM64/AMD64 auto-detected)
- ✅ Start the monitoring stack (Prometheus, Grafana, Node Exporter)
- ✅ Deploy the main application with nginx
- ✅ Handle port conflicts automatically
- ✅ Check all services are healthy
- ✅ Show you all the URLs and login info

## 📊 **What You Get:**

### **Main Application:**
- **URL**: http://localhost:8080 (or http://localhost if port 80 is free)
- **Features**: Access control, countdown timer, beta codes, admin API

### **Monitoring Stack:**
- **Grafana**: http://localhost:3001 (admin/admin123)
- **Prometheus**: http://localhost:9091 (auto-detected port)
- **Node Exporter**: http://localhost:9100

## 🛠️ **Management Commands:**

### **Stop Everything:**
```bash
docker stop pawsistente-prod pawsistente-prometheus pawsistente-grafana pawsistente-node-exporter
```

### **Remove Everything:**
```bash
docker rm pawsistente-prod pawsistente-prometheus pawsistente-grafana pawsistente-node-exporter
```

### **View Logs:**
```bash
docker logs -f pawsistente-prod        # Main app
docker logs -f pawsistente-grafana     # Grafana
```

### **Check Access Code Usage:**
```bash
npm run admin:stats
```

## 🎯 **Key Features:**

1. **Single Command** - No more docker-compose issues
2. **Auto Platform Detection** - Works on ARM and x86_64
3. **Port Conflict Resolution** - Automatically finds free ports
4. **Health Checks** - Verifies all services are working
5. **Complete Monitoring** - Grafana dashboards ready to go
6. **Production Ready** - Nginx optimization, security headers, restart policies

## 🎉 **Success!**

Your Pawsistente app is now deployed with:
- ✅ **Production container** with nginx
- ✅ **Full monitoring stack** with Grafana dashboards
- ✅ **Access control system** with countdown timer
- ✅ **Admin API** for usage statistics
- ✅ **Automatic port management**

**Ready for production!** 🚀

---

## 📝 **Files Structure:**

```
├── scripts/
│   └── deploy.sh                 # ← THE ONLY SCRIPT YOU NEED
├── Dockerfile.prod               # Production Docker image
├── docker-compose.prod.yml       # Production compose (optional)
├── monitoring/
│   ├── prometheus.yml            # Prometheus config
│   └── grafana/                  # Grafana dashboards
└── DEPLOYMENT_GUIDE.md           # This guide
```

**Just run `./scripts/deploy.sh` and you're done!** 🎯
