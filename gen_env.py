
from pathlib import Path
import sys
import secrets

ROOT_ENV = Path(".env")
BACKEND_ENV = Path("backend/.env")
FRONTEND_ENV = Path("frontend/.env")

SECRETS_DIR = Path("secrets")
MONGO_USERNAME_FILE = SECRETS_DIR / "mongo_root_username.txt"
MONGO_PASSWORD_FILE = SECRETS_DIR / "mongo_root_password.txt"

DEFAULT_MONGO_USER = "appadmin"
DEFAULT_DB_NAME = "multi-service-application"


def read_env(path):
    """Read KEY=VALUE entries from an existing env file."""
    values = {}

    if not path.exists():
        return values

    for line in path.read_text(encoding="utf-8").splitlines():
        line = line.strip()

        if line and not line.startswith("#") and "=" in line:
            key, value = line.split("=", 1)
            values[key.strip()] = value.strip()

    return values


def read_secret(path):
    """Read an existing secret without its trailing newline."""
    if not path.exists():
        return None

    value = path.read_text(encoding="utf-8").strip()
    return value or None


def write_private_file(path, content):
    """Create a private secret file without overwriting existing secrets."""
    path.parent.mkdir(parents=True, exist_ok=True)

    if path.exists():
        path.chmod(0o600)
        print(f"Keeping existing secret: {path}")
        return

    path.write_text(content.rstrip("\n") + "\n", encoding="utf-8")
    path.chmod(0o600)
    print(f"Created secret: {path}")


def write_config_file(path, content):
    """Create or update a non-secret configuration file."""
    path.parent.mkdir(parents=True, exist_ok=True)
    content = content.rstrip("\n") + "\n"

    if path.exists() and path.read_text(encoding="utf-8") == content:
        path.chmod(0o600)
        print(f"Configuration unchanged: {path}")
        return

    path.write_text(content, encoding="utf-8")
    path.chmod(0o600)
    print(f"Updated configuration: {path}")


def create_env():
    """Create secret files and non-secret environment configuration."""
    existing = read_env(ROOT_ENV)

    mongo_user = (
        read_secret(MONGO_USERNAME_FILE)
        or existing.get("MONGO_INITDB_ROOT_USERNAME")
        or DEFAULT_MONGO_USER
    )

    mongo_password = (
        read_secret(MONGO_PASSWORD_FILE)
        or existing.get("MONGO_INITDB_ROOT_PASSWORD")
        or secrets.token_hex(24)
    )

    db_name = existing.get("DB_NAME", DEFAULT_DB_NAME)

    # Create secrets first. Never overwrite existing secret files.
    write_private_file(MONGO_USERNAME_FILE, mongo_user)
    write_private_file(MONGO_PASSWORD_FILE, mongo_password)

    # Write only non-secret configuration to .env files.
    write_config_file(
        ROOT_ENV,
        f"DB_NAME={db_name}",
    )

    write_config_file(
        BACKEND_ENV,
        "PORT=555\n"
        f"DB_NAME={db_name}\n"
        "REDIS_URI=redis://redis:6379\n",
    )

    write_config_file(
        FRONTEND_ENV,
        "REACT_APP_API_URL=/api",
    )

    print("Configuration files are ready!")


if __name__ == "__main__":
    try:
        create_env()
    except OSError as err:
        print(f"ERROR: {err}", file=sys.stderr)
        sys.exit(1)
