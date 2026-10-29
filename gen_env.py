from pathlib import Path
import sys
import secrets

ROOT_ENV = Path(".env")
BACKEND_ENV = Path("backend/.env")
FRONTEND_ENV = Path("frontend/.env")

MONGO_USER = "appadmin"
DB_NAME = "multi-service-application"

def read_env(path):
    """Read KEY=VALUE from existing env file"""
    values = {}

    if not path.exists():
        return values

    for line in path.read_text(encoding="utf-8").splitlines():
        line = line.strip()

        if line and not line.startswith("#") and "=" in line:
            key, value = line.split("=", 1)
            values[key.strip()] = value.strip()

    return values

def prepare_configs():
    """Generate all config using same creds"""

    existing = read_env(ROOT_ENV)

    mongo_user = existing.get(
        "MONGO_INITDB_ROOT_USERNAME", MONGO_USER
    )

    mongo_pass = existing.get(
        "MONGO_INITDB_ROOT_PASSWORD"
    )

    db_name = existing.get(
        "DB_NAME", DB_NAME
    )

    if not mongo_pass:
        mongo_pass = secrets.token_hex(24)

    root_config = (
        f"MONGO_INITDB_ROOT_USERNAME={mongo_user}\n"
        f"MONGO_INITDB_ROOT_PASSWORD={mongo_pass}\n"
        f"DB_NAME={db_name}\n"
    )

    backend_config = (
        f"MONGO_INITDB_ROOT_USERNAME={mongo_user}\n"
        f"MONGO_INITDB_ROOT_PASSWORD={mongo_pass}\n"
        f"MONGODB_URI=mongodb://{mongo_user}:{mongo_pass}"
        f"@mongodb:27017/{db_name}?authSource=admin\n"
        "PORT=555\n"
        "REDIS_URI=redis://redis:6379\n"
    )

    frontend_config = (
        "REACT_APP_API_URL=http://backend:555\n"
        # "REACT_APP_API_URL=/api\n"
    )

    return {
        ROOT_ENV: root_config,
        BACKEND_ENV: backend_config,
        FRONTEND_ENV: frontend_config
    }

def create_env():
    """Create .env files"""
    configs = prepare_configs()

    for env_file in configs:
        env_file.parent.mkdir(parents=True, exist_ok=True)

    for env_file, content in configs.items():
        if env_file.exists():
            print(f"Keeping existing file: {env_file}")
            continue

        env_file.write_text(content, encoding="utf-8")
        env_file.chmod(0o600)
        print(f"Created: {env_file}")

if __name__ == "__main__":
    try:
        create_env()
    except OSError as err:
        print(f"ERROR: {err}", file=sys.stderr)
        sys.exit(1)