#!/bin/bash

# UNRAVEL Automated Testing Script
# Runs comprehensive tests and attempts fixes

echo "🧪 UNRAVEL Automated Test Runner"
echo "================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to check if container is running
check_container() {
    echo -e "${BLUE}📦 Checking Docker container...${NC}"
    
    if ! docker ps | grep -q "unravel"; then
        echo -e "${YELLOW}⚠️  Unravel container not running. Starting...${NC}"
        
        # Stop any existing container
        docker stop unravel 2>/dev/null || true
        docker rm unravel 2>/dev/null || true
        
        # Start new container
        docker run -d --name unravel -p 3007:3006 -e PORT=3006 unravel
        
        echo -e "${GREEN}✅ Container started${NC}"
        sleep 5  # Wait for startup
    else
        echo -e "${GREEN}✅ Container is running${NC}"
    fi
}

# Function to run health check
health_check() {
    echo -e "${BLUE}🔍 Performing health check...${NC}"
    
    for i in {1..5}; do
        if curl -s http://localhost:3007/health > /dev/null; then
            echo -e "${GREEN}✅ Health check passed${NC}"
            return 0
        fi
        echo -e "${YELLOW}⏳ Waiting for service (attempt $i/5)...${NC}"
        sleep 2
    done
    
    echo -e "${RED}❌ Health check failed${NC}"
    return 1
}

# Function to install test dependencies
install_deps() {
    echo -e "${BLUE}📦 Installing test dependencies...${NC}"
    
    cd "$(dirname "$0")/.."
    
    if [ ! -f "package.json" ]; then
        echo -e "${RED}❌ package.json not found${NC}"
        return 1
    fi
    
    # Install axios if not present
    if ! npm list axios &>/dev/null; then
        echo -e "${YELLOW}📦 Installing axios...${NC}"
        npm install --save-dev axios
    fi
    
    echo -e "${GREEN}✅ Dependencies ready${NC}"
}

# Function to run the test suite
run_test_suite() {
    echo -e "${BLUE}🧪 Running test suite...${NC}"
    
    cd "$(dirname "$0")"
    
    # Run the automated test suite
    if node automated-test-suite.js; then
        echo -e "${GREEN}✅ All tests completed successfully${NC}"
        return 0
    else
        echo -e "${YELLOW}⚠️  Some tests failed, but suite completed${NC}"
        return 1
    fi
}

# Function to run quick smoke tests
quick_smoke_test() {
    echo -e "${BLUE}💨 Running quick smoke tests...${NC}"
    
    BASE_URL="http://localhost:3007"
    
    # Test 1: Health endpoint
    if curl -s "${BASE_URL}/health" | grep -q "healthy"; then
        echo -e "${GREEN}✅ Health endpoint working${NC}"
    else
        echo -e "${RED}❌ Health endpoint failed${NC}"
        return 1
    fi
    
    # Test 2: Frontend loading
    if curl -s "${BASE_URL}/" | grep -q "Unravel"; then
        echo -e "${GREEN}✅ Frontend loading${NC}"
    else
        echo -e "${RED}❌ Frontend failed${NC}"
        return 1
    fi
    
    # Test 3: API status
    if curl -s "${BASE_URL}/api/status" | grep -q "status"; then
        echo -e "${GREEN}✅ API status working${NC}"
    else
        echo -e "${RED}❌ API status failed${NC}"
        return 1
    fi
    
    # Test 4: Patterns endpoint
    if curl -s "${BASE_URL}/api/patterns" | grep -q "patterns"; then
        echo -e "${GREEN}✅ Patterns endpoint working${NC}"
    else
        echo -e "${RED}❌ Patterns endpoint failed${NC}"
        return 1
    fi
    
    echo -e "${GREEN}✅ All smoke tests passed${NC}"
    return 0
}

# Function to attempt automatic fixes
attempt_fixes() {
    echo -e "${BLUE}🔧 Attempting automatic fixes...${NC}"
    
    # Fix 1: Restart container if unhealthy
    if ! health_check; then
        echo -e "${YELLOW}🔄 Restarting container...${NC}"
        docker restart unravel
        sleep 10
        
        if health_check; then
            echo -e "${GREEN}✅ Container restart fixed the issue${NC}"
        else
            echo -e "${RED}❌ Container restart did not fix the issue${NC}"
        fi
    fi
    
    # Fix 2: Check for port conflicts
    if netstat -tulpn | grep ":3007" | grep -v "docker"; then
        echo -e "${YELLOW}⚠️  Port 3007 conflict detected${NC}"
        echo -e "${YELLOW}🔧 Consider stopping other services on port 3007${NC}"
    fi
    
    # Fix 3: Check disk space
    DISK_USAGE=$(df / | tail -1 | awk '{print $5}' | sed 's/%//')
    if [ "$DISK_USAGE" -gt 90 ]; then
        echo -e "${YELLOW}⚠️  Disk usage high: ${DISK_USAGE}%${NC}"
        echo -e "${YELLOW}🔧 Consider cleaning up disk space${NC}"
    fi
}

# Function to generate monitoring script
generate_monitor() {
    echo -e "${BLUE}📊 Generating monitoring script...${NC}"
    
    cat > monitor-unravel.sh << 'EOF'
#!/bin/bash
# Unravel Health Monitor
# Run this periodically to monitor service health

check_and_restart() {
    if ! curl -s http://localhost:3007/health > /dev/null; then
        echo "$(date): Unravel unhealthy, restarting..."
        docker restart unravel
        sleep 10
        
        if curl -s http://localhost:3007/health > /dev/null; then
            echo "$(date): Restart successful"
        else
            echo "$(date): Restart failed, manual intervention required"
        fi
    else
        echo "$(date): Unravel healthy"
    fi
}

check_and_restart
EOF
    
    chmod +x monitor-unravel.sh
    echo -e "${GREEN}✅ Monitoring script created: monitor-unravel.sh${NC}"
}

# Main execution
main() {
    echo "Starting automated testing and maintenance..."
    echo ""
    
    # Step 1: Check and start container
    check_container
    
    # Step 2: Health check
    if ! health_check; then
        echo -e "${RED}❌ Initial health check failed${NC}"
        attempt_fixes
        health_check || {
            echo -e "${RED}❌ Unable to fix health issues${NC}"
            exit 1
        }
    fi
    
    # Step 3: Quick smoke test
    if ! quick_smoke_test; then
        echo -e "${YELLOW}⚠️  Smoke tests failed, attempting fixes...${NC}"
        attempt_fixes
        quick_smoke_test || {
            echo -e "${RED}❌ Smoke tests still failing after fixes${NC}"
            exit 1
        }
    fi
    
    # Step 4: Install dependencies and run full test suite
    install_deps
    run_test_suite
    
    # Step 5: Generate monitoring tools
    generate_monitor
    
    echo ""
    echo -e "${GREEN}🎉 Testing and setup complete!${NC}"
    echo -e "${BLUE}💡 Tips:${NC}"
    echo "  • Run './monitor-unravel.sh' periodically to check health"
    echo "  • Use './run-tests.sh' to run tests anytime"
    echo "  • Check Docker logs with: docker logs unravel"
    echo ""
}

# Run main function
main "$@"