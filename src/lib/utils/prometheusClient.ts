// Purpose: Prometheus client for sending metrics
// Context: Sends custom metrics to Prometheus using the Pushgateway pattern

interface MetricData {
  name: string;
  value: number;
  labels?: Record<string, string>;
  type: 'counter' | 'gauge' | 'histogram';
}

class PrometheusClient {
  private prometheusUrl: string;
  private jobName: string;

  constructor() {
    // Get Prometheus URL from environment or use default
    this.prometheusUrl = process.env.PROMETHEUS_URL || 'http://pawsistente-prometheus:9090';
    this.jobName = process.env.PROMETHEUS_JOB_NAME || 'pawsistente-app';
  }

  // Purpose: Send metrics to Prometheus
  // Context: Formats and sends metrics data to Prometheus
  async sendMetrics(metrics: MetricData[]): Promise<void> {
    try {
      const prometheusMetrics = this.formatMetrics(metrics);
      
      // Send to Prometheus using the /api/v1/write endpoint
      const response = await fetch(`${this.prometheusUrl}/api/v1/write`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-protobuf',
          'Content-Encoding': 'snappy',
        },
        body: prometheusMetrics
      });

      if (!response.ok) {
        console.warn('Failed to send metrics to Prometheus:', response.status, response.statusText);
      }
    } catch (error) {
      console.warn('Error sending metrics to Prometheus:', error);
    }
  }

  // Purpose: Format metrics in Prometheus text format
  // Context: Converts metric data to Prometheus exposition format
  private formatMetrics(metrics: MetricData[]): string {
    return metrics.map(metric => {
      const labels = metric.labels ? 
        Object.entries(metric.labels)
          .map(([key, value]) => `${key}="${value}"`)
          .join(',') : '';
      
      const labelString = labels ? `{${labels}}` : '';
      
      return `${metric.name}${labelString} ${metric.value}`;
    }).join('\n') + '\n';
  }

  // Purpose: Send a single counter metric
  // Context: Convenience method for counter metrics
  async incrementCounter(name: string, labels: Record<string, string> = {}): Promise<void> {
    await this.sendMetrics([{
      name,
      value: 1,
      labels,
      type: 'counter'
    }]);
  }

  // Purpose: Send a gauge metric
  // Context: Convenience method for gauge metrics
  async setGauge(name: string, value: number, labels: Record<string, string> = {}): Promise<void> {
    await this.sendMetrics([{
      name,
      value,
      labels,
      type: 'gauge'
    }]);
  }

  // Purpose: Send a histogram metric
  // Context: Convenience method for histogram metrics
  async observeHistogram(name: string, value: number, labels: Record<string, string> = {}): Promise<void> {
    await this.sendMetrics([{
      name,
      value,
      labels,
      type: 'histogram'
    }]);
  }
}

// Export singleton instance
export const prometheusClient = new PrometheusClient();
