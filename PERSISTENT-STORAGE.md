# Unravel Persistent Storage Guide

This guide explains how to configure Unravel to maintain your settings, API keys, and custom patterns across container rebuilds and updates.

## Overview

Unravel uses a hybrid storage approach:
- **Environment Variables**: Production API keys and server configuration
- **Volume-Mounted Configuration**: User settings and custom patterns persist across rebuilds
- **Browser LocalStorage**: Fast access and offline fallback

## Quick Setup

### 1. Create Persistent Configuration Directory

```bash
# Create config directory for persistent storage
mkdir -p ./config
chmod 755 ./config
```

### 2. Environment Configuration

Copy the example environment file and configure:

```bash
cp .env.example .env
# Edit .env with your preferred settings
```

### 3. Run with Persistent Storage

#### Option A: Docker Compose (Recommended)

```bash
# Use the persistent storage configuration
docker-compose -f docker-compose.persistent.yml up -d
```

#### Option B: Docker Run

```bash
docker run -d \
  --name unravel-persistent \
  -p 3007:3006 \
  -v $(pwd)/config:/app/config \
  -e OLLAMA_BASE_URL=http://host.docker.internal:11434 \
  unravel:latest
```

## Storage Locations

### Application Data
- **Settings**: `./config/settings.json`
- **Custom Patterns**: `./config/custom_patterns/`
- **Logs**: Container logs (use `docker logs unravel`)

### File Structure
```
config/
├── settings.json              # User preferences and API keys
└── custom_patterns/           # Custom patterns directory
    ├── my_pattern/
    │   ├── system.md          # Pattern content
    │   └── metadata.json      # Pattern metadata
    └── another_pattern/
        ├── system.md
        └── metadata.json
```

## Configuration Priority

Settings are loaded in this priority order (highest to lowest):

1. **Environment Variables** - Production API keys
2. **Backend Storage** - Persistent settings file
3. **Browser LocalStorage** - Cached settings
4. **Default Values** - Fallback configuration

## API Key Management

### Environment Variables (Production)
Set in `.env` file or container environment:
```bash
OPENAI_API_KEY=sk-your-key-here
ANTHROPIC_API_KEY=sk-ant-your-key-here
```

### Web Interface (Development)
- Go to Settings (⚙️) in the web interface
- Add API keys - they're automatically saved to persistent storage
- Environment variables override web interface settings

### Security Features
- API keys from environment variables are not saved to persistent storage
- Only user-entered keys are persisted
- Settings file permissions are restricted
- No API keys are logged or exposed in client-side code

## Custom Patterns

### Creating Custom Patterns
1. Open Settings → Pattern Management
2. Click "Create Custom"
3. Fill in pattern details and content
4. Save - automatically stored in `./config/custom_patterns/`

### Pattern Templates
Built-in templates available:
- **Basic Analysis** - General content analysis
- **Writing Assistant** - Text improvement and editing
- **Content Summarizer** - Summarization tasks
- **Information Extractor** - Data extraction
- **Creative Generator** - Creative content generation

### Pattern Management
- **Enable/Disable**: Toggle patterns in dropdown
- **Edit**: Modify existing patterns
- **Export**: Copy pattern content
- **Delete**: Remove custom patterns (built-ins can't be deleted)

## Backup and Migration

### Backup Configuration
```bash
# Backup all settings and custom patterns
tar -czf unravel-backup-$(date +%Y%m%d).tar.gz config/
```

### Restore Configuration
```bash
# Restore from backup
tar -xzf unravel-backup-YYYYMMDD.tar.gz
```

### Migration Between Environments
1. Copy `config/` directory to new environment
2. Update `.env` file for new environment settings
3. Restart container

## Troubleshooting

### Settings Not Persisting
1. Check volume mount: `docker inspect unravel-persistent`
2. Verify config directory permissions: `ls -la config/`
3. Check container logs: `docker logs unravel-persistent`

### API Keys Not Working
1. Check environment variables: `docker exec unravel-persistent env | grep API`
2. Verify settings file: `cat config/settings.json`
3. Check browser console for API validation errors

### Custom Patterns Missing
1. Verify pattern files: `ls -la config/custom_patterns/`
2. Check pattern metadata: `cat config/custom_patterns/*/metadata.json`
3. Restart container to reload patterns

### Container Updates
When updating Unravel:
1. Stop container: `docker-compose down`
2. Pull new image: `docker-compose pull`
3. Start with same volumes: `docker-compose up -d`
4. Settings and patterns are preserved

## Advanced Configuration

### Production Deployment
```yaml
# docker-compose.prod.yml
services:
  unravel:
    image: unravel:latest
    environment:
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
    volumes:
      - unravel_config:/app/config
    networks:
      - production
    restart: unless-stopped
```

### Development with Live Reload
```yaml
# docker-compose.dev.yml
services:
  unravel:
    build: .
    volumes:
      - ./config:/app/config
      - ./patterns:/app/patterns:ro  # Read-only pattern development
    environment:
      - NODE_ENV=development
```

### Health Monitoring
```bash
# Check application health
curl -f http://localhost:3007/api/status

# Monitor logs
docker logs -f unravel-persistent

# Check storage usage
du -sh config/
```

## Best Practices

1. **Regular Backups**: Backup `config/` directory weekly
2. **Environment Variables**: Use for production API keys
3. **Version Control**: Don't commit `.env` files with real keys
4. **Security**: Limit config directory access permissions
5. **Monitoring**: Set up health checks for production deployments
6. **Updates**: Test pattern functionality after container updates

## Support

For issues with persistent storage:
1. Check this guide first
2. Review container logs
3. Test with minimal configuration
4. Report issues with diagnostic information

---

**Remember**: Settings persist across container rebuilds, so your API keys and custom patterns are safe during updates!