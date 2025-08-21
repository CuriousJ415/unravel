# Unravel Troubleshooting Guide

## Cloud Services Not Loading

### Symptoms
- Cloud services/providers not appearing in dropdown
- CORS errors in browser console
- API authentication failures
- 404 errors when accessing Unravel

### Common Causes & Solutions

#### 1. CORS Authentication Issues
**Problem:** Browser console shows CORS policy errors when accessing auth endpoints.

**Error Message:**
```
Access to fetch at 'https://auth.nauhauslab.com/...' has been blocked by CORS policy: 
No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

**Solution:** Add CORS headers to your reverse proxy configuration.

For Traefik, add this middleware to your dynamic configuration:
```yaml
middlewares:
  auth-cors:
    headers:
      accessControlAllowMethods:
        - GET
        - POST
        - OPTIONS
      accessControlAllowHeaders:
        - "*"
      accessControlAllowOriginList:
        - "https://unravel.nauhauslab.com"
      accessControlMaxAge: 100
      addVaryHeader: true
```

Then apply it to your auth router:
```yaml
routers:
  authelia:
    rule: "Host(`auth.nauhauslab.com`)"
    service: authelia-service
    entryPoints:
      - web
    middlewares:
      - auth-cors
```

#### 2. 2FA Authentication Problems
**Problem:** 2FA requests causing authentication failures in web applications.

**Solution:** Configure your authentication system to use single-factor authentication for web services.

In Authelia configuration (`authelia/configuration.yml`):
```yaml
access_control:
  rules:
    # Protected services (one_factor - 2FA system has issues with web apps)
    - domain:
        - unravel.nauhauslab.com
      policy: one_factor
      subject: 
        - "group:admins"
        - "group:guests"
```

#### 3. API Credentials Reset
**Problem:** API keys disappear after authentication issues or container restarts.

**Causes:**
- Browser localStorage cleared during CORS debugging
- Authentication session reset
- Container restart clearing browser state

**Prevention:**
1. **Use environment variables** - Add API keys to `.env` file:
   ```bash
   OPENAI_API_KEY=sk-your-key-here
   ANTHROPIC_API_KEY=sk-ant-your-key-here
   OLLAMA_BASE_URL=http://192.168.4.61:11434
   ```

2. **Document credentials** - Keep them in a secure password manager
3. **Export settings** - Use Unravel's export feature if available

#### 4. Service Discovery Issues
**Problem:** 404 errors when accessing Unravel through reverse proxy.

**Check:**
1. Container is running: `docker ps | grep unravel`
2. Network connectivity: `docker network ls`
3. Traefik configuration syntax: `docker logs traefik`

**Fix network issues:**
```bash
# Connect to correct network
docker network connect homelab_homelab unravel

# Restart Traefik
docker-compose -f docker-apps-stack.yml restart traefik
```

## Quick Diagnostic Steps

1. **Check container status:**
   ```bash
   docker ps | grep unravel
   docker logs unravel --tail 20
   ```

2. **Test direct access:**
   ```bash
   curl -I http://localhost:3007
   ```

3. **Check browser console:**
   - Open Developer Tools (F12)
   - Look for CORS, authentication, or network errors

4. **Verify authentication:**
   - Try accessing auth portal directly
   - Complete any required authentication flows

5. **Restart services:**
   ```bash
   docker-compose -f docker-apps-stack.yml restart traefik
   docker restart unravel
   ```

## Related Issues

- [Authentication Configuration](./README.md#ai-provider-configuration)
- [Docker Network Setup](../docker-apps-stack.yml)
- [Traefik Configuration](../traefik/dynamic/authelia.yml)