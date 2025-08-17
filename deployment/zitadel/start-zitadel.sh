#!/bin/bash
set -e

# Marker file to track if initialization has been completed
INIT_MARKER="/zitadel-data/.zitadel-initialized"

# Check if Zitadel has already been initialized
if [ -f "$INIT_MARKER" ]; then
    echo "Zitadel already initialized, starting normally..."
    exec zitadel start --masterkey "${ZITADEL_MASTERKEY}"
else
    echo "First time startup, running initialization..."
    
    # Run initialization
    zitadel start-from-init --masterkey "${ZITADEL_MASTERKEY}" --steps /config/init-steps.yaml &
    ZITADEL_PID=$!
    
    # Wait for initialization to complete (check for the instance to be created)
    echo "Waiting for initialization to complete..."
    
    # Wait for Zitadel to finish initialization (monitor logs or process)
    wait $ZITADEL_PID
    
    # If we get here, initialization completed successfully
    echo "Initialization completed successfully"
    touch "$INIT_MARKER"
    
    # Now start normally for this session
    exec zitadel start --masterkey "${ZITADEL_MASTERKEY}"
fi