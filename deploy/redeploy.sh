#!/bin/bash
# Rebuild paket deploy: frontend build + backend bundle + zip siap upload.
# Jalankan dari folder deploy: bash redeploy.sh

set -e

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DEPLOY="$ROOT/deploy"
STAGING="$DEPLOY/reddith-app"
ZIP="$DEPLOY/reddith-app.zip"

echo "▶ Build frontend..."
cd "$ROOT/frontend"
npm run build >/dev/null

echo "▶ Bungkus backend + frontend dist..."
rm -rf "$STAGING" "$ZIP"
mkdir -p "$STAGING"
# Exclude: node_modules, .env, SELURUH storage/ (jangan timpa file upload user), log
rsync -a \
  --exclude='node_modules' \
  --exclude='.env' \
  --exclude='storage' \
  --exclude='*.log' \
  "$ROOT/backend-node/" "$STAGING/"
cp -R "$ROOT/frontend/dist" "$STAGING/public"

echo "▶ Zip..."
cd "$DEPLOY"
zip -rq reddith-app.zip reddith-app
rm -rf "$STAGING"

SIZE=$(du -h "$ZIP" | cut -f1)
echo ""
echo "✅ Paket siap upload: $ZIP ($SIZE)"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Langkah redeploy via hPanel (no SSH):"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "  1. hPanel → Files → File Manager"
echo "  2. Masuk folder: /home/USERNAME/reddith-app/"
echo "  3. Hapus file lama (opsional, biar extract clean):"
echo "     • server.js, package.json, package-lock.json"
echo "     • folder: src/, public/"
echo "     (JANGAN hapus: .env, storage/, node_modules/)"
echo "  4. Upload reddith-app.zip ke folder reddith-app/"
echo "  5. Klik kanan zip → Extract → pilih folder sekarang"
echo "     Kalau ada dialog overwrite: pilih 'Yes to all'"
echo "  6. Hapus reddith-app.zip setelah extract"
echo "  7. Pindahkan isi folder 'reddith-app' hasil extract"
echo "     ke parent (kalau extract-nya ter-nested)"
echo "  8. hPanel → Advanced → Node.js → pilih app Reddith"
echo "     • Klik 'Run NPM Install' (kalau ada dep baru)"
echo "     • Klik 'Restart'"
echo ""
echo "  ✓ Test: https://plum-giraffe-248987.hostingersite.com"
echo ""
