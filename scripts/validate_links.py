#!/usr/bin/env python3
"""AnnalesDNB — Script de validation des liens
Usage: python3 scripts/validate_links.py"""

import json, requests, time, sys
from pathlib import Path
from urllib.parse import urlparse

HEADERS = {
    "User-Agent": "Mozilla/5.0 (compatible; AnnalesDNB-Validator/1.0)"
}
TIMEOUT = 10
DELAY_BETWEEN_REQUESTS = 1.5  # Secondes (respecter les serveurs)
MAX_URLS_PER_ANNALE = 3       # Garder les 3 meilleurs liens par épreuve

def check_url(url: str) -> dict:
    """Vérifie une URL via HEAD request. Retourne le statut et le type de contenu."""
    try:
        r = requests.head(url, headers=HEADERS, timeout=TIMEOUT,
                          allow_redirects=True)
        content_type = r.headers.get("Content-Type", "")
        is_pdf = "pdf" in content_type.lower() or url.lower().endswith(".pdf")
        return {
            "url": url,
            "status": r.status_code,
            "ok": r.status_code == 200,
            "is_pdf": is_pdf,
            "content_type": content_type
        }
    except Exception as e:
        return {"url": url, "status": 0, "ok": False, "error": str(e)}

def validate_all(annales_path: Path) -> dict:
    data = json.loads(annales_path.read_text())
    results = {}
    annales = data.get("annales", [])
    total = sum(len(a.get("urls_sujets", [])) + len(a.get("urls_corriges", [])) for a in annales)
    print(f"→ {len(annales)} épreuves à valider, {total} URLs totales")

    for annale in annales:
        aid = annale["id"]
        results[aid] = {"sujets": [], "corriges": []}
        for url in annale.get("urls_sujets", []):
            print(f"  [{aid}] sujet: {url[:60]}...")
            result = check_url(url)
            results[aid]["sujets"].append(result)
            time.sleep(DELAY_BETWEEN_REQUESTS)
        for url in annale.get("urls_corriges", []):
            print(f"  [{aid}] corrigé: {url[:60]}...")
            result = check_url(url)
            results[aid]["corriges"].append(result)
            time.sleep(DELAY_BETWEEN_REQUESTS)

    return results

def update_json_with_results(annales_path: Path, results: dict):
    data = json.loads(annales_path.read_text())
    for annale in data["annales"]:
        aid = annale["id"]
        if aid in results:
            valid_sujets = [r["url"] for r in results[aid]["sujets"] if r["ok"]]
            valid_corriges = [r["url"] for r in results[aid]["corriges"] if r["ok"]]
            annale["urls_sujets"] = valid_sujets[:MAX_URLS_PER_ANNALE]
            annale["urls_corriges"] = valid_corriges[:MAX_URLS_PER_ANNALE]
            annale["corriges_disponibles"] = len(valid_corriges) > 0
            annale["status"] = "valide" if valid_sujets else "manquant"
            if valid_sujets and not valid_corriges:
                annale["status"] = "partiel"
    data["meta"]["derniere_validation"] = __import__("datetime").date.today().isoformat()
    annales_path.write_text(json.dumps(data, ensure_ascii=False, indent=2))
    print(f"✅ JSON mis à jour : {annales_path}")

if __name__ == "__main__":
    annales_path = Path("data/annales.json")
    if not annales_path.exists():
        print("❌ data/annales.json introuvable"); sys.exit(1)
    results = validate_all(annales_path)
    update_json_with_results(annales_path, results)

    # Rapport final
    all_missing = [aid for aid, r in results.items()
                   if not any(x["ok"] for x in r["sujets"])]
    if all_missing:
        print(f"\n⚠️  Épreuves sans sujet trouvé ({len(all_missing)}) :")
        for aid in all_missing:
            print(f"   • {aid}")
    print("\n✅ Validation terminée.")
