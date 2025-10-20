# Grafana Reprovisioning Guide

## Purpose: Guide for reprovisioning Grafana with new dashboards and data sources
## Context: When you need to update Grafana configuration or reset it completely

## Quick Reprovision (Recommended)

If you just want to update the dashboards and data sources without losing data:

```bash
# 1. Stop the Grafana container
docker-compose -f docker-compose.prod.yml stop grafana

# 2. Remove the old container (keeps data volume)
docker-compose -f docker-compose.prod.yml rm grafana

# 3. Start Grafana again (it will pick up new configs)
docker-compose -f docker-compose.prod.yml up -d grafana

# 4. Wait for Grafana to start (about 30 seconds)
sleep 30

# 5. Check if it's running
docker-compose -f docker-compose.prod.yml ps grafana
```

## Complete Reset (If you want to start fresh)

If you want to completely reset Grafana and lose all existing data:

```bash
# 1. Stop all services
docker-compose -f docker-compose.prod.yml down

# 2. Remove Grafana data volume (THIS WILL DELETE ALL DATA)
docker volume rm pawsistente_grafana-data

# 3. Start all services again
docker-compose -f docker-compose.prod.yml up -d

# 4. Wait for services to start
sleep 60

# 5. Check all services are running
docker-compose -f docker-compose.prod.yml ps
```

## Accessing Grafana

After reprovisioning, you can access Grafana at:
- **URL**: `http://localhost:3000` (or your server's IP)
- **Username**: `admin`
- **Password**: `admin123`

## Available Dashboards

After reprovisioning, you should see these dashboards:

1. **Pawsistente - Comprehensive Monitoring**
   - Request rate and total requests
   - Active users and app visits
   - Events added vs removed
   - Page views by page
   - Average page load times
   - API response times
   - Container CPU and memory usage
   - HTTP request rates
   - Most popular events
   - User agent distribution

2. **Pawsistente - System Metrics**
   - Container CPU usage
   - Container memory usage and limits
   - Container restart counts
   - Network I/O
   - Disk I/O
   - Container health status

## Data Sources

The following data sources are automatically configured:

1. **Prometheus** (Default)
   - URL: `http://prometheus:9090`
   - Collects metrics from all services

## Troubleshooting

### If Grafana doesn't start:
```bash
# Check logs
docker-compose -f docker-compose.prod.yml logs grafana

# Check if ports are available
netstat -tulpn | grep :3000
```

### If dashboards don't appear:
```bash
# Check if dashboard files exist
ls -la monitoring/grafana/dashboards/

# Restart Grafana
docker-compose -f docker-compose.prod.yml restart grafana
```

### If metrics aren't showing:
```bash
# Check if Prometheus is running
docker-compose -f docker-compose.prod.yml ps prometheus

# Check Prometheus targets
curl http://localhost:9090/api/v1/targets

# Check if app metrics endpoint works
curl http://localhost:3000/api/metrics
```

## Monitoring URLs

- **Grafana**: http://localhost:3000
- **Prometheus**: http://localhost:9090
- **App Metrics**: http://localhost:3000/api/metrics

## Configuration Files

The monitoring configuration is located in:
- `monitoring/prometheus.yml` - Prometheus configuration
- `monitoring/grafana/datasources/prometheus.yml` - Grafana data source
- `monitoring/grafana/dashboards/` - Dashboard definitions

## Updating Dashboards

To update dashboards in the future:
1. Edit the JSON files in `monitoring/grafana/dashboards/`
2. Run the quick reprovision steps above
3. The new dashboards will be automatically loaded
