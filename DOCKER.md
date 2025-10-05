# Docker Deployment Guide

This guide explains how to deploy the Receipt Scanner application using Docker.

## Prerequisites

- Docker and Docker Compose installed on your system
- OpenAI API key

## Quick Start

1. **Clone the repository and navigate to the project directory:**
   ```bash
   git clone <repository-url>
   cd receipt-scanner
   ```

2. **Create environment file:**
   ```bash
   cp .env.example .env
   ```

3. **Edit the `.env` file with your configuration:**
   ```env
   OPENAI_API_KEY=your_openai_api_key_here
   OPENAI_MODEL=gpt-4o-mini
   NODE_ENV=production
   PORT=3000
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

4. **Build and run with Docker Compose:**
   ```bash
   docker-compose up --build
   ```

5. **Access the application:**
   Open your browser and go to `http://localhost:3000`

## Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `OPENAI_API_KEY` | Your OpenAI API key | - | Yes |
| `OPENAI_MODEL` | OpenAI model to use | `gpt-4o-mini` | No |
| `NODE_ENV` | Environment mode | `production` | No |
| `PORT` | Port to run the application | `3000` | No |
| `NEXT_PUBLIC_APP_URL` | Public URL of the application | `http://localhost:3000` | No |

## Available OpenAI Models

- `gpt-4o-mini` (recommended for cost efficiency)
- `gpt-4o`
- `gpt-4-turbo`
- `gpt-3.5-turbo`
- `gpt-5-nano` (if available)

## Docker Commands

### Build the image:
```bash
docker build -t receipt-scanner .
```

### Run the container:
```bash
docker run -p 3000:3000 \
  -e OPENAI_API_KEY=your_api_key \
  -e OPENAI_MODEL=gpt-4o-mini \
  receipt-scanner
```

### Run with Docker Compose:
```bash
# Start in background
docker-compose up -d

# View logs
docker-compose logs -f

# Stop the application
docker-compose down

# Rebuild and restart
docker-compose up --build
```

## Health Check

The application includes a health check endpoint at `/api/health` that returns:
- Application status
- Timestamp
- Uptime

## Production Deployment

### Using Docker Compose (Recommended)

1. **Set up your production environment:**
   ```bash
   # Create production environment file
   cp .env.example .env.production
   ```

2. **Update the environment variables for production:**
   ```env
   NODE_ENV=production
   NEXT_PUBLIC_APP_URL=https://your-domain.com
   OPENAI_API_KEY=your_production_api_key
   OPENAI_MODEL=gpt-4o-mini
   ```

3. **Deploy with Docker Compose:**
   ```bash
   docker-compose -f docker-compose.yml --env-file .env.production up -d
   ```

### Using Docker Swarm

1. **Initialize Docker Swarm:**
   ```bash
   docker swarm init
   ```

2. **Deploy the stack:**
   ```bash
   docker stack deploy -c docker-compose.yml receipt-scanner
   ```

### Using Kubernetes

You can use the Docker image with Kubernetes by creating appropriate manifests:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: receipt-scanner
spec:
  replicas: 3
  selector:
    matchLabels:
      app: receipt-scanner
  template:
    metadata:
      labels:
        app: receipt-scanner
    spec:
      containers:
      - name: receipt-scanner
        image: receipt-scanner:latest
        ports:
        - containerPort: 3000
        env:
        - name: OPENAI_API_KEY
          valueFrom:
            secretKeyRef:
              name: openai-secret
              key: api-key
        - name: OPENAI_MODEL
          value: "gpt-4o-mini"
```

## Troubleshooting

### Common Issues

1. **Container fails to start:**
   - Check if all required environment variables are set
   - Verify the OpenAI API key is valid
   - Check Docker logs: `docker-compose logs`

2. **Application is not accessible:**
   - Ensure the port is not already in use
   - Check firewall settings
   - Verify the container is running: `docker ps`

3. **OpenAI API errors:**
   - Verify the API key is correct
   - Check if the model is available
   - Ensure you have sufficient API credits

### Debugging

1. **View container logs:**
   ```bash
   docker-compose logs -f receipt-scanner
   ```

2. **Access container shell:**
   ```bash
   docker-compose exec receipt-scanner sh
   ```

3. **Check container status:**
   ```bash
   docker-compose ps
   ```

## Security Considerations

1. **Never commit `.env` files to version control**
2. **Use secrets management in production**
3. **Keep your OpenAI API key secure**
4. **Regularly update base images for security patches**

## Performance Optimization

1. **Use multi-stage builds** (already implemented)
2. **Enable Next.js standalone output** (already configured)
3. **Use appropriate resource limits in production**
4. **Consider using a reverse proxy (nginx) for production**

## Monitoring

The application includes:
- Health check endpoint at `/api/health`
- Docker health checks
- Structured logging

For production monitoring, consider integrating with:
- Prometheus + Grafana
- ELK Stack
- Cloud monitoring solutions (AWS CloudWatch, Google Cloud Monitoring, etc.)
