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
