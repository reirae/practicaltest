-- Q4.5: table of common passwords, loaded from 100k-most-used-passwords-NCSC.txt
CREATE TABLE IF NOT EXISTS common_passwords (
    password TEXT PRIMARY KEY
);

-- Bulk-load the NCSC common password list (mounted alongside this script)
COPY common_passwords(password)
FROM '/docker-entrypoint-initdb.d/100k-most-used-passwords-NCSC.txt'
WITH (FORMAT text);

-- Q4.9: log created users (username + creation time only, no password stored)
CREATE TABLE IF NOT EXISTS "2402725" (
    id SERIAL PRIMARY KEY,
    username TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
