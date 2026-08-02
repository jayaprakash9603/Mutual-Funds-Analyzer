# Optional TLS certificates (Docker)

Most laptops and servers need nothing here. `docker compose up --build` works
with only this README present — the backend uses the default Java truststore.

Outbound HTTPS from the backend container may fail with:

```text
PKIX path building failed ... unable to find valid certification path
```

That usually means network TLS inspection is replacing the public certificate
chain with an internal CA that the host OS trusts, but the JVM inside Docker
does not. Only then add CA files as below.

## Fix (TLS-inspecting networks only)

1. Place one or more PEM/CRT CA files in this folder (for example
   `corporate-proxy-ca-bundle.crt`).
2. `docker-compose.yml` mounts this folder at `/certs` in the backend container.
3. The backend entrypoint imports those CAs into the Java truststore on startup.

### Export a CA bundle from the host

```powershell
python -c "
import ssl, socket
from pathlib import Path
out = Path('deploy/certs/corporate-proxy-ca-bundle.crt')
ctx = ssl.SSLContext(ssl.PROTOCOL_TLS_CLIENT)
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE
with socket.create_connection(('api.mfapi.in', 443), timeout=20) as sock:
    with ctx.wrap_socket(sock, server_hostname='api.mfapi.in') as ssock:
        chain = ssock.get_unverified_chain()
        pems = [ssl.DER_cert_to_PEM_cert(c).strip() for c in chain[1:]]
        out.write_text('\n'.join(pems) + '\n', encoding='ascii')
print('wrote', out)
"
```

Do **not** commit CA files to git — they are gitignored.
