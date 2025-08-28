#!/bin/bash
set -e

# Application database and user are created automatically by PostgreSQL via POSTGRES_USER/POSTGRES_DB
# This script creates the logto database for the authentication service

# Create logto database and user
psql -v ON_ERROR_STOP=1 --username "${POSTGRES_USER}" --dbname="${POSTGRES_DB}" <<-EOSQL
    -- Create logto database for authentication service
    SELECT 'CREATE DATABASE logto'
    WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'logto')\gexec

    -- Create logto user if it doesn't exist with CREATEDB and CREATEROLE privileges
    DO \$\$
    BEGIN
        IF NOT EXISTS (SELECT FROM pg_user WHERE usename = '${LOGTO_DB_USER}') THEN
            CREATE USER ${LOGTO_DB_USER} WITH PASSWORD '${LOGTO_DB_PASSWORD}' CREATEDB CREATEROLE;
        END IF;
    END
    \$\$;

    -- Grant privileges on logto database
    GRANT ALL PRIVILEGES ON DATABASE logto TO ${LOGTO_DB_USER};
    
    -- Connect to logto database to grant schema permissions
    \c logto
    
    -- Grant schema permissions
    GRANT ALL ON SCHEMA public TO ${LOGTO_DB_USER};
    GRANT CREATE ON SCHEMA public TO ${LOGTO_DB_USER};
EOSQL

echo "Additional databases initialized (logto)"