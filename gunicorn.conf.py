import os

# Render dynamically assigns a PORT environment variable (e.g. 10000)
# Default to 8080 for local testing
port = os.environ.get("PORT", "8080")
bind = f"0.0.0.0:{port}"

workers = 2
threads = 4
timeout = 120
keepalive = 5
