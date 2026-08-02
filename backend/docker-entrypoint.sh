#!/bin/sh
set -eu

# Corporate TLS inspection may replace public certs with an internal CA.
# Import any PEM/CRT files mounted at /certs into a writable Java truststore
# so HttpClient can reach upstream HTTPS APIs (for example api.mfapi.in).
CERT_DIR="${SSL_CERT_DIR:-/certs}"
TRUST_STORE="${JAVA_TRUST_STORE:-/tmp/mfa-cacerts}"
STORE_PASS="${JAVA_TRUST_STORE_PASSWORD:-changeit}"
JAVA_CACERTS="${JAVA_HOME}/lib/security/cacerts"
SPLIT_DIR="/tmp/mfa-ca-split"

import_one_cert() {
  cert_file="$1"
  alias_name="$2"
  if keytool -importcert -noprompt \
      -alias "$alias_name" \
      -file "$cert_file" \
      -keystore "$TRUST_STORE" \
      -storepass "$STORE_PASS" >/dev/null 2>&1; then
    echo "Imported TLS CA: ${alias_name}"
    return 0
  fi
  echo "Skipped TLS CA (already present or invalid): ${alias_name}" >&2
  return 0
}

# No CA files is a valid default (public networks). Only import when *.crt/*.pem exist.
if [ -d "$CERT_DIR" ] && [ -f "$JAVA_CACERTS" ]; then
  cert_count=0
  for cert in "$CERT_DIR"/*.crt "$CERT_DIR"/*.pem; do
    [ -e "$cert" ] || continue
    [ -f "$cert" ] || continue
    case "$(basename "$cert")" in
      *.md|*.sh|*.txt|*.der) continue ;;
    esac
    cert_count=$((cert_count + 1))
  done

  if [ "$cert_count" -gt 0 ]; then
    echo "Importing ${cert_count} TLS CA file(s) from ${CERT_DIR}"
    cp "$JAVA_CACERTS" "$TRUST_STORE"
    chmod 644 "$TRUST_STORE"
    rm -rf "$SPLIT_DIR"
    mkdir -p "$SPLIT_DIR"
    idx=0
    for cert in "$CERT_DIR"/*.crt "$CERT_DIR"/*.pem; do
      [ -e "$cert" ] || continue
      [ -f "$cert" ] || continue
      case "$(basename "$cert")" in
        *.md|*.sh|*.txt|*.der) continue ;;
      esac
      # Split multi-cert PEM bundles — keytool only reads the first cert otherwise.
      awk -v out="$SPLIT_DIR" -v base="$(basename "$cert" | tr -c 'A-Za-z0-9._-' '_')" '
        /-----BEGIN CERTIFICATE-----/ { n++; file=sprintf("%s/%s-%02d.crt", out, base, n) }
        n > 0 { print > file }
        /-----END CERTIFICATE-----/ { close(file) }
      ' "$cert"
    done
    for split in "$SPLIT_DIR"/*.crt; do
      [ -e "$split" ] || continue
      [ -f "$split" ] || continue
      import_one_cert "$split" "corp-ca-${idx}"
      idx=$((idx + 1))
    done
    JAVA_OPTS="${JAVA_OPTS:-} -Djavax.net.ssl.trustStore=${TRUST_STORE} -Djavax.net.ssl.trustStorePassword=${STORE_PASS}"
    export JAVA_OPTS
  else
    echo "No extra TLS CAs in ${CERT_DIR}; using the default Java truststore"
  fi
fi

exec java $JAVA_OPTS -jar /app/app.jar
