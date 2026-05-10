# Galecto Platform - User Manual

## Table of Contents
1. [Introduction](#introduction)
2. [Getting Started](#getting-started)
3. [Login and Account](#login-and-account)
4. [Dashboard Overview](#dashboard-overview)
5. [Exploring Logs](#exploring-logs)
6. [Metrics and Monitoring](#metrics-and-monitoring)
7. [Alert Management](#alert-management)
8. [Replay - Debug Failed Requests](#replay---debug-failed-requests)
9. [Dashboards](#dashboards)
10. [Deploy Markers](#deploy-markers)
11. [SLO Monitoring](#slo-monitoring)
12. [API Keys Management](#api-keys-management)
13. [Notifications](#notifications)
14. [Troubleshooting](#troubleshooting)

---

## 1. Introduction

### What is Galecto?

Galecto is an enterprise observability platform that helps you:
- **Monitor** your application's performance in real-time
- **Debug** issues quickly using replay functionality
- **Track** deployments and correlate them with errors
- **Set** service level objectives (SLOs) for your applications

### Key Features
- 📊 Real-time metrics and dashboards
- 🔍 Powerful log search and filtering
- 🚨 Automated alerting
- 🔄 Request replay for debugging
- 🚀 Deployment tracking
- ⏱️ SLO monitoring

---

## 2. Getting Started

### Access the Platform

Open your web browser and go to:
```
http://localhost:3000
```

### System Requirements
- Modern web browser (Chrome, Firefox, Edge, Safari)
- An account created by your administrator or self-signup

---

## 3. Login and Account

### Creating an Account

1. Click **"Sign Up"** on the login page
2. Enter your email address
3. Create a strong password
4. Enter your **Organization Name** (e.g., your company name)
5. Click **"Create Account"**

### Logging In

1. Enter your email
2. Enter your password
3. Click **"Login"**

### Your Profile

After logging in, you can access your profile by clicking your name/email in the top-right corner:
- View your role (Owner, Admin, Developer, Observer)
- Update your password
- Log out

---

## 4. Dashboard Overview

When you first log in, you'll see the main dashboard.

### What's on the Dashboard?

| Section | Description |
|---------|-------------|
| **Quick Stats** | Shows key metrics at a glance |
| **Active Alerts** | Current alerts needing attention |
| **Service Health** | Status of your monitored services |
| **Recent Logs** | Latest log entries |
| **SLO Status** | Your service level objectives |

### Navigation

Use the **left sidebar** to navigate between sections:
- 🏠 **Dashboard** - Main overview
- 📝 **Logs** - Search and explore logs
- 📊 **Metrics** - Performance data
- 🚨 **Alerts** - Alert management
- 🔄 **Replay** - Debug failed requests
- 📈 **Dashboards** - Custom dashboards
- 🚀 **Deployments** - Track deployments
- ⏱️ **SLOs** - Service level objectives
- ⚙️ **Settings** - API keys, notifications, users

---

## 5. Exploring Logs

### Finding Logs

1. Click **"Logs"** in the sidebar
2. Use the search bar to find specific messages
3. Apply filters to narrow results

### Search Tips

- **By keyword**: Type "error", "exception", "timeout"
- **By service**: Filter to a specific service
- **By time**: Select time range (last hour, last 24h, etc.)
- **By level**: Filter by error, warning, info

### Viewing Log Details

Click on any log entry to see:
- Full error message
- Stack trace
- Request/response details
- Timestamp
- Trace ID (for correlating with traces)

### Filtering

Use the filter panel to:
- Select specific services
- Choose time ranges
- Filter by log level
- Search by trace ID

---

## 6. Metrics and Monitoring

### Viewing Metrics

1. Click **"Metrics"** in the sidebar
2. Select the service you want to monitor
3. Choose the metric type (response time, error rate, etc.)

### Available Metrics

| Metric | Description |
|--------|-------------|
| **Response Time** | How long requests take |
| **Error Rate** | Percentage of failed requests |
| **Throughput** | Number of requests per second |
| **Saturation** | Resource usage levels |

### Time Range

Use the time selector to view metrics over different periods:
- Last 15 minutes
- Last 1 hour
- Last 24 hours
- Last 7 days
- Custom range

---

## 7. Alert Management

### Viewing Alerts

1. Click **"Alerts"** in the sidebar
2. See all alerts with status (Active, Acknowledged, Resolved)

### Alert Severity Levels

- 🔴 **Critical** - Immediate attention needed
- 🟠 **High** - Important but not critical
- 🟡 **Medium** - Should be addressed
- 🟢 **Low** - Minor issues

### Managing Alerts

**Acknowledge an Alert:**
1. Click on the alert
2. Click **"Acknowledge"**
3. Optionally assign to yourself or a team member

**Resolve an Alert:**
1. Click on the acknowledged alert
2. Click **"Resolve"**
3. Add notes about the resolution

### Alert Notifications

Alerts can be sent to:
- Email
- Slack
- Webhook

Configure notifications in **Settings → Notifications**

---

## 8. Replay - Debug Failed Requests

### What is Replay?

Replay lets you "replay" a failed request to see exactly what happened. This helps you debug issues in production safely.

### How to Use Replay

1. Click **"Replay"** in the sidebar
2. Search for the failed request by:
   - Trace ID
   - Time range
   - Service name
3. Click on a failed request to view details
4. Click **"Replay"** to execute a test request

### What Replay Does

- Captures the original request (URL, method, headers, body)
- Sends it to your application again
- Shows you the response
- Records the replay for audit

### Safety Features

Replay includes protections:
- ⚠️ Filters out sensitive headers (authorization, cookies)
- 🔒 Masks PII (personally identifiable information)
- 🚫 Blocks dangerous URLs (file:, command:, etc.)

---

## 9. Dashboards

### Creating a Dashboard

1. Click **"Dashboards"** in the sidebar
2. Click **"+ New Dashboard"**
3. Give your dashboard a name
4. Click **"Add Widget"**

### Widget Types

| Widget | Shows |
|--------|-------|
| **Line Chart** | Metrics over time |
| **Bar Chart** | Comparisons |
| **Number** | Single metric value |
| **Table** | Tabular data |
| **Service Map** | Service relationships |

### Customizing Widgets

1. Click the edit icon on a widget
2. Choose:
   - Data source (service)
   - Metric type
   - Time range
   - Display options
3. Save your changes

### Sharing Dashboards

- Dashboards are visible to all users in your organization
- Share the URL with team members
- Set as your default dashboard

---

## 10. Deploy Markers

### Tracking Deployments

1. Click **"Deployments"** in the sidebar
2. View all deployments with timestamps

### Adding a Deploy Mark

If you're using CI/CD, deployments can be tracked automatically. Otherwise, your team can manually log deployments.

### Using Deploy Markers

When investigating issues:
1. Go to **Logs** or **Metrics**
2. Look for the deployment marker
3. See what changed at that time
4. Correlate errors with deployments

---

## 11. SLO Monitoring

### What is SLO?

SLO (Service Level Objective) defines targets for your service reliability, like "99.9% of requests should succeed."

### Setting Up SLOs

1. Click **"SLOs"** in the sidebar
2. Click **"+ New SLO"**
3. Configure:
   - **Name**: e.g., "API Success Rate"
   - **Service**: Which service to monitor
   - **Type**: Error rate, latency, etc.
   - **Threshold**: Target percentage
   - **Window**: Time period (7 days, 30 days)

### Monitoring SLOs

- Green ✅ = Meeting target
- Yellow ⚠️ = At risk
- Red ❌ = Breached

### SLO Alerts

Get notified when SLOs are at risk or breached:
- Configure in SLO settings
- Set warning threshold (e.g., warn at 99.5% when target is 99.9%)

---

## 12. API Keys Management

### What is an API Key?

An API key allows your applications to send data to Galecto programmatically.

### Creating an API Key

1. Go to **Settings** (gear icon)
2. Click **"API Keys"**
3. Click **"+ Add API Key"**
4. Enter a name (e.g., "Production App")
5. Select a role ( Owner, Admin, Developer, Observer )
6. Optionally set expiration date
7. Click **"Create"**
8. **Copy the key** - it won't be shown again!

### Using Your API Key

Include the key in your API requests:

```bash
curl -X POST http://localhost:3001/api/v1/ingest \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"service": "my-app", "name": "LOG", "payload": {"message": "Hello"}}'
```

### Rotating API Keys

For security, rotate keys periodically:
1. Create a new key
2. Update your application to use the new key
3. Revoke the old key

### Revoking API Keys

If a key is compromised:
1. Go to **Settings → API Keys**
2. Click **"Revoke"** on the compromised key
3. The key will immediately stop working

---

## 13. Notifications

### Setting Up Notifications

1. Go to **Settings**
2. Click **"Notifications"**
3. Click **"+ Add Channel"**

### Notification Types

**Email Notifications:**
- Enter email addresses
- Choose which alerts to receive

**Slack Notifications:**
- Enter Slack webhook URL
- Choose which alerts to send

**Webhook Notifications:**
- Enter webhook URL
- Configure payload format

### Managing Alerts by Notification

Select which alerts trigger notifications:
- Critical alerts only
- All alerts
- Specific alert rules

---

## 14. Troubleshooting

### Can't Log In?
- Check your email/password
- Clear browser cache
- Try incognito/private mode

### Not Seeing Data?
- Verify API key is correct
- Check your application is sending data
- Ensure services are running

### Alerts Not Receiving?
- Check notification settings
- Verify email/Slack configuration
- Check spam folder

### Need Help?
- Contact your organization's admin
- Check the internal wiki
- Submit a support ticket

---

## Quick Reference Card

| Task | Where to Go |
|------|-------------|
| View logs | Logs |
| Check metrics | Metrics |
| See alerts | Alerts |
| Debug issues | Replay |
| Create dashboard | Dashboards |
| Track deployments | Deployments |
| Set SLOs | SLOs |
| Manage API keys | Settings → API Keys |
| Configure alerts | Settings → Notifications |
| Manage users | Settings → Users |

---

**End of User Manual**

*For technical support, contact your administrator.*