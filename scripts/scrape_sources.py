#!/usr/bin/env python3
"""AnnalesDNB — Application des URLs PDF réelles dans data/annales.json.

Les URLs ci-dessous ont été trouvées par recherche réelle (WebFetch/WebSearch)
sur les sites sources le 2026-08-16, puis vérifiées individuellement en HTTP
HEAD (200, Content-Type application/pdf). Aucune URL n'est devinée par motif :
chacune a été vue dans du contenu effectivement récupéré.

Deux cas d'échec assumés (pas un bug de ce script) :
- FRANCAIS-2020-METROPOLE : sujet trouvé, aucun corrigé publié nulle part
  (confirmé par 2 sources indépendantes).
- HG-EMC-2020-METROPOLE : session Métropole annulée (COVID), aucune session
  de rattrapage HG-EMC Métropole retrouvée (seules des versions
  Polynésie/Nouvelle-Calédonie/série professionnelle existent).
- HG-EMC-2021-METROPOLE : sujet trouvé, aucun corrigé localisé.

Usage : python3 scripts/scrape_sources.py
Ensuite : python3 scripts/validate_links.py (re-vérification avant publication)
"""

import json
from pathlib import Path

# Nouvelles sources trouvées en cours de recherche, absentes de la liste
# d'origine de la Section 7 (sources_reference).
NOUVELLES_SOURCES = {
    "geoconfluences": {"nom": "Géoconfluences", "url_base": "https://geoconfluences.ens-lyon.fr", "fiabilite": "haute", "corriges": False},
    "ac_lille":        {"nom": "Académie de Lille", "url_base": "https://pedagogie.ac-lille.fr", "fiabilite": "haute", "corriges": False},
    "freemaths":       {"nom": "Freemaths", "url_base": "https://www.freemaths.fr", "fiabilite": "moyenne", "corriges": True},
    "cafepedagogique": {"nom": "Café Pédagogique", "url_base": "https://www.cafepedagogique.net", "fiabilite": "moyenne", "corriges": False},
    "reactions_pelemele": {"nom": "Réactions Pêle-Mêle", "url_base": "https://reactions-pelemele.com", "fiabilite": "moyenne", "corriges": True},
    "groupe_reussite": {"nom": "Groupe Réussite", "url_base": "https://groupe-reussite.fr", "fiabilite": "moyenne", "corriges": True},
}

# id épreuve -> (urls_sujets, urls_corriges)
URLS = {
    "FRANCAIS-2026-METROPOLE": (
        ["https://omidhsgzrozcvvknnurv.supabase.co/storage/v1/object/public/sujets/1782476156338_Sujet-DNB-2026-Metropole-Francais.pdf"],
        ["https://omidhsgzrozcvvknnurv.supabase.co/storage/v1/object/public/sujets/1782920277054_correction_Correction-DNB-2026-Metropole-Francais%20%282%29.pdf"],
    ),
    "FRANCAIS-2025-METROPOLE": (
        ["https://omidhsgzrozcvvknnurv.supabase.co/storage/v1/object/public/sujets/1761901674023_dnb2025groupe1-tartuffe-2.pdf",
         "https://lettres-pedagogie.web.ac-grenoble.fr/sites/default/files/Media/document/dnb2025groupe1-tartuffe.pdf"],
        ["https://omidhsgzrozcvvknnurv.supabase.co/storage/v1/object/public/sujets/1786885359165_correction_Corrige_DNB_Francais_2025_Metropole_Tartuffe.pdf"],
    ),
    "FRANCAIS-2024-METROPOLE": (
        ["https://omidhsgzrozcvvknnurv.supabase.co/storage/v1/object/public/sujets/1761906992825_dnb2024_-_berenice_racine_groupe_1.pdf",
         "https://lettres-pedagogie.web.ac-grenoble.fr/sites/default/files/Media/document/dnb2024_-_la_chambre_des_officiers_dugain_metropole.pdf",
         "https://lettres-pedagogie.web.ac-grenoble.fr/sites/default/files/Media/document/dnb2024_-_lecriture_ou_la_vie_semprun_metropole.pdf"],
        ["https://omidhsgzrozcvvknnurv.supabase.co/storage/v1/object/public/sujets/1786886838264_correction_Corrige_DNB_Francais_2024_Metropole_Berenice.pdf"],
    ),
    "FRANCAIS-2023-METROPOLE": (
        ["https://omidhsgzrozcvvknnurv.supabase.co/storage/v1/object/public/sujets/1761900277615_sujet_2023_metropole_antilles_guyane.pdf"],
        ["https://omidhsgzrozcvvknnurv.supabase.co/storage/v1/object/public/sujets/1761900278615_correction_1-elements_de_correction.pdf"],
    ),
    "FRANCAIS-2022-METROPOLE": (
        ["https://omidhsgzrozcvvknnurv.supabase.co/storage/v1/object/public/sujets/1761901252364_2022_metropole_gil_blas.pdf",
         "https://omidhsgzrozcvvknnurv.supabase.co/storage/v1/object/public/sujets/1761901157559_2022_metropole_-_le_lion_et_le_moucheron.pdf"],
        ["https://omidhsgzrozcvvknnurv.supabase.co/storage/v1/object/public/sujets/1761901254267_correction_2022_corrige_gil_blas.pdf",
         "https://omidhsgzrozcvvknnurv.supabase.co/storage/v1/object/public/sujets/1761901158825_correction_dnb_juin_note_de_linspection_a_lintention_des_professeurs_correcteurs.pdf"],
    ),
    "FRANCAIS-2021-METROPOLE": (
        ["https://omidhsgzrozcvvknnurv.supabase.co/storage/v1/object/public/sujets/1761900937248_2021_metropole_le_capitaine_fracasse.pdf"],
        ["https://omidhsgzrozcvvknnurv.supabase.co/storage/v1/object/public/sujets/1761900984998_correction_2021_corrige_capitaine_fracasse.pdf"],
    ),
    "FRANCAIS-2020-METROPOLE": (
        ["https://omidhsgzrozcvvknnurv.supabase.co/storage/v1/object/public/sujets/1761907628384_2020_metropole_pourceaugnac.pdf",
         "https://lettres-pedagogie.web.ac-grenoble.fr/sites/default/files/Media/document/2020_metropole_pourceaugnac.pdf"],
        [],  # aucun corrigé trouvé
    ),

    "MATHS-2026-METROPOLE": (
        ["https://omidhsgzrozcvvknnurv.supabase.co/storage/v1/object/public/sujets/1782816399498_26GENMATME1.pdf"],
        ["https://omidhsgzrozcvvknnurv.supabase.co/storage/v1/object/public/sujets/1782817111974_correction_Correction-DNB-2026-Metropole-Mathematiques.pdf"],
    ),
    "MATHS-2025-METROPOLE": (
        ["https://omidhsgzrozcvvknnurv.supabase.co/storage/v1/object/public/sujets/1767124430009_Brevet_Me_tropole_26_06_2025_FK.pdf"],
        ["https://omidhsgzrozcvvknnurv.supabase.co/storage/v1/object/public/sujets/1767124430518_correction_Corrige_Brevet_Metropole_26_06_2025_DV.pdf"],
    ),
    "MATHS-2024-METROPOLE": (
        ["https://omidhsgzrozcvvknnurv.supabase.co/storage/v1/object/public/sujets/1767124538693_Brevet_Metropole_1_07_2024_DV.pdf"],
        ["https://omidhsgzrozcvvknnurv.supabase.co/storage/v1/object/public/sujets/1767124539062_correction_Corrige_brevet_Metropole_1_07_2024_DV.pdf"],
    ),
    "MATHS-2023-METROPOLE": (
        ["https://omidhsgzrozcvvknnurv.supabase.co/storage/v1/object/public/sujets/1767124675493_Brevet_Metropole_26_juin_2023_FK.pdf"],
        ["https://omidhsgzrozcvvknnurv.supabase.co/storage/v1/object/public/sujets/1767124675855_correction_Corrige_Brevevet_Metropole_26_06_2023_DV.pdf"],
    ),
    "MATHS-2022-METROPOLE": (
        ["https://www.apmep.fr/IMG/pdf/Brevet_metro_juin_2022_DV.pdf"],
        ["https://www.apmep.fr/IMG/pdf/corrige_brevet_metropole_30_06_2022_cp-2.pdf"],
    ),
    "MATHS-2021-METROPOLE": (
        ["https://www.apmep.fr/IMG/pdf/brevet_metropole_28_06_2021_dv.pdf"],
        ["https://www.apmep.fr/IMG/pdf/corrige_brevet_metropole_28_06_2021_ol.pdf"],
    ),
    "MATHS-2020-METROPOLE": (
        ["https://www.apmep.fr/IMG/pdf/brevet_metropole_sept_2020_dv-2.pdf"],
        ["https://www.apmep.fr/IMG/pdf/corrige_brevet_metropole_sept_2020_dv.pdf"],
    ),

    "HG-EMC-2026-METROPOLE": (
        ["https://omidhsgzrozcvvknnurv.supabase.co/storage/v1/object/public/sujets/1782746415996_SHGEMCM1.pdf"],
        ["https://omidhsgzrozcvvknnurv.supabase.co/storage/v1/object/public/sujets/1782750503846_correction_Correction-DNB-2026-Metropole-HG-EMC-Vichy-Morvan.pdf"],
    ),
    "HG-EMC-2025-METROPOLE": (
        ["https://omidhsgzrozcvvknnurv.supabase.co/storage/v1/object/public/sujets/1761914271690_25genhgemcme1_v3.pdf",
         "https://geoconfluences.ens-lyon.fr/fichiers/examens-programmes-sujets/25genhgemcme1.pdf",
         "https://pedagogie.ac-lille.fr/histoire-geographie/wp-content/uploads/sites/8/2025/06/25GENHGEMCME1.pdf"],
        ["https://omidhsgzrozcvvknnurv.supabase.co/storage/v1/object/public/sujets/1761929904642_correction_correctionhgsujet09.pdf",
         "https://www.freemaths.fr/sujets-dnb-college/brevet-serie-generale/histoire-geographie-emc/annees/annee-2025/metropole/sujet-et-correction/corrige/brevet-histoire-geographie-emc-metropole-2025-correction.pdf"],
    ),
    "HG-EMC-2024-METROPOLE": (
        ["https://pedagogie.ac-lille.fr/histoire-geographie/wp-content/uploads/sites/8/2024/07/Sujet-DNB-2024-Me%CC%81tropole-session-de-juillet.pdf",
         "https://www.freemaths.fr/sujets-dnb-college/brevet-serie-generale/histoire-geographie-emc/annees/annee-2024/metropole/sujet-et-correction/brevet-histoire-geographie-emc-metropole-2024-sujet.pdf"],
        ["https://www.freemaths.fr/sujets-dnb-college/brevet-serie-generale/histoire-geographie-emc/annees/annee-2024/metropole/sujet-et-correction/corrige/brevet-histoire-geographie-emc-metropole-2024-correction.pdf"],
    ),
    "HG-EMC-2023-METROPOLE": (
        ["https://www.cafepedagogique.net/wp-content/uploads/2023/06/DNB-2023-Hist-Geo.pdf",
         "https://www.freemaths.fr/sujets-dnb-college/brevet-serie-generale/histoire-geographie-emc/annees/annee-2023/metropole/sujet-et-correction/brevet-histoire-geographie-emc-metropole-2023-sujet.pdf"],
        ["https://www.freemaths.fr/sujets-dnb-college/brevet-serie-generale/histoire-geographie-emc/annees/annee-2023/metropole/sujet-et-correction/corrige/brevet-histoire-geographie-emc-metropole-2023-correction.pdf"],
    ),
    "HG-EMC-2022-METROPOLE": (
        ["https://pedagogie.ac-lille.fr/histoire-geographie/wp-content/uploads/sites/8/2022/09/Metropole-session-septembre-2022.pdf",
         "https://www.freemaths.fr/sujets-dnb-college/brevet-serie-generale/histoire-geographie-emc/annees/annee-2022/metropole/sujet-et-correction/brevet-histoire-geographie-emc-metropole-2022-sujet.pdf"],
        ["https://www.freemaths.fr/sujets-dnb-college/brevet-serie-generale/histoire-geographie-emc/annees/annee-2022/metropole/sujet-et-correction/corrige/brevet-histoire-geographie-emc-metropole-2022-correction.pdf"],
    ),
    "HG-EMC-2021-METROPOLE": (
        ["https://pedagogie.ac-lille.fr/histoire-geographie/wp-content/uploads/sites/8/2021/06/Metropole.pdf"],
        [],  # aucun corrigé trouvé
    ),
    "HG-EMC-2020-METROPOLE": ([], []),  # session Métropole annulée, aucun rattrapage retrouvé

    "SVT-2026-METROPOLE": (
        ["https://omidhsgzrozcvvknnurv.supabase.co/storage/v1/object/public/sujets/1782740711106_Sujet-DNB-2026-Metropole-Sciences-SVT.pdf"],
        ["https://omidhsgzrozcvvknnurv.supabase.co/storage/v1/object/public/sujets/1782740712185_correction_Correction-DNB-2026-Metropole-Sciences-SVT.pdf"],
    ),
    "SVT-2025-METROPOLE": (
        ["https://omidhsgzrozcvvknnurv.supabase.co/storage/v1/object/public/sujets/1762094037767_25genscmeag1%20sujet%2003.pdf",
         "https://www.freemaths.fr/sujets-dnb-college/brevet-serie-generale/sciences/annees/annee-2025/metropole/sujet-et-correction/brevet-sciences-metropole-2025-sujet.pdf"],
        ["https://omidhsgzrozcvvknnurv.supabase.co/storage/v1/object/public/sujets/1786098985217_correction_Correction-DNB-2025-Metropole-SVT-Doryphores.pdf",
         "https://www.freemaths.fr/sujets-dnb-college/brevet-serie-generale/sciences/annees/annee-2025/metropole/sujet-et-correction/corrige/brevet-sciences-metropole-2025-correction.pdf"],
    ),
    "SVT-2024-METROPOLE": (
        ["https://omidhsgzrozcvvknnurv.supabase.co/storage/v1/object/public/sujets/1762094079832_24genscg11%20sujet%2006.pdf"],
        ["https://omidhsgzrozcvvknnurv.supabase.co/storage/v1/object/public/sujets/1786099603244_correction_Correction-DNB-2024-Metropole-SVT-Paludisme.pdf"],
    ),
    "SVT-2023-METROPOLE": (
        ["https://omidhsgzrozcvvknnurv.supabase.co/storage/v1/object/public/sujets/1762094148530_23genscmeag1%20sujet%2011.pdf",
         "https://omidhsgzrozcvvknnurv.supabase.co/storage/v1/object/public/sujets/1762094170330_23genscg11%20sujet%2012.pdf"],
        ["https://omidhsgzrozcvvknnurv.supabase.co/storage/v1/object/public/sujets/1786100246306_correction_Correction-DNB-2023-Metropole-SVT-Idotee-abeille-des-mers.pdf",
         "https://omidhsgzrozcvvknnurv.supabase.co/storage/v1/object/public/sujets/1786117546534_correction_Correction-DNB-2023-Metropole-SVT-El-Nino.pdf"],
    ),
    "SVT-2022-METROPOLE": (
        ["https://www.freemaths.fr/sujets-dnb-college/brevet-serie-generale/sciences/annees/annee-2022/metropole/sujet-et-correction/brevet-sciences-metropole-2022-sujet.pdf"],
        ["https://www.freemaths.fr/sujets-dnb-college/brevet-serie-generale/sciences/annees/annee-2022/metropole/sujet-et-correction/corrige/brevet-sciences-metropole-2022-correction.pdf"],
    ),
    "SVT-2021-METROPOLE": (
        ["https://reactions-pelemele.com/wp-content/uploads/2023/01/brevet-sujet-sciences-metropole-general-2021.pdf"],
        ["https://reactions-pelemele.com/wp-content/uploads/2023/01/Correction-brevet-PC-metropole-general-2021-blog.pdf"],
    ),
    "SVT-2020-METROPOLE": (
        ["https://groupe-reussite.fr/ressources/wp-content/uploads/Annales/brevet/sujet-brevet-sciences-2020-metropole.pdf",
         "https://reactions-pelemele.com/wp-content/uploads/2023/01/brevet-sujet-rattrapage-sciences-metropole-general-2020.pdf"],
        ["https://groupe-reussite.fr/ressources/wp-content/uploads/Annales/brevet/corrige-brevet-sciences-2020-metropole.pdf"],
    ),

    "PC-2026-METROPOLE": (
        ["https://omidhsgzrozcvvknnurv.supabase.co/storage/v1/object/public/sujets/1782740681358_Sujet-DNB-2026-Metropole-Sciences-Physique-Chimie.pdf"],
        ["https://omidhsgzrozcvvknnurv.supabase.co/storage/v1/object/public/sujets/1782740682132_correction_Correction-DNB-2026-Metropole-Sciences-Physique-Chimie.pdf"],
    ),
    "PC-2025-METROPOLE": (
        ["https://www.freemaths.fr/sujets-dnb-college/brevet-serie-generale/sciences/annees/annee-2025/metropole/sujet-et-correction/brevet-sciences-metropole-2025-sujet.pdf"],
        ["https://www.freemaths.fr/sujets-dnb-college/brevet-serie-generale/sciences/annees/annee-2025/metropole/sujet-et-correction/corrige/brevet-sciences-metropole-2025-correction.pdf"],
    ),
    "PC-2024-METROPOLE": (
        ["https://omidhsgzrozcvvknnurv.supabase.co/storage/v1/object/public/sujets/1761999833306_Piscine-et-equilibre-de-leau.pdf"],
        ["https://omidhsgzrozcvvknnurv.supabase.co/storage/v1/object/public/sujets/1786529942132_correction_Corrige_DNB_Physique-Chimie_2024_Metropole_piscine-plongeon.pdf"],
    ),
    "PC-2023-METROPOLE": (
        ["https://omidhsgzrozcvvknnurv.supabase.co/storage/v1/object/public/sujets/1761999900237_Augmentation-du-niveau-marin.pdf"],
        ["https://omidhsgzrozcvvknnurv.supabase.co/storage/v1/object/public/sujets/1786530429303_correction_Corrige_DNB_Physique-Chimie_2023_Metropole_niveau-marin.pdf"],
    ),
    "PC-2022-METROPOLE": (
        ["https://www.freemaths.fr/sujets-dnb-college/brevet-serie-generale/sciences/annees/annee-2022/metropole/sujet-et-correction/brevet-sciences-metropole-2022-sujet.pdf"],
        ["https://www.freemaths.fr/sujets-dnb-college/brevet-serie-generale/sciences/annees/annee-2022/metropole/sujet-et-correction/corrige/brevet-sciences-metropole-2022-correction.pdf"],
    ),
    "PC-2021-METROPOLE": (
        ["https://reactions-pelemele.com/wp-content/uploads/2023/01/brevet-sujet-sciences-metropole-general-2021.pdf"],
        ["https://reactions-pelemele.com/wp-content/uploads/2023/01/Correction-brevet-PC-metropole-general-2021-blog.pdf"],
    ),
    "PC-2020-METROPOLE": (
        ["https://reactions-pelemele.com/wp-content/uploads/2023/01/brevet-sujet-rattrapage-sciences-metropole-general-2020.pdf"],
        ["https://reactions-pelemele.com/wp-content/uploads/2023/01/Correction-brevet-PC-metropole-general-rattrapage-2020-blog.pdf"],
    ),
}


def main():
    path = Path("data/annales.json")
    data = json.loads(path.read_text())

    data["sources_reference"].update(NOUVELLES_SOURCES)

    # PrépaDNB sert désormais ses PDF depuis son bucket Supabase public,
    # pas depuis prepadnb.com/sujets — corrige l'URL de référence pour que
    # la détection de source (par nom d'hôte) fonctionne côté frontend.
    if "prepadnb" in data["sources_reference"]:
        data["sources_reference"]["prepadnb"]["url_base"] = "https://omidhsgzrozcvvknnurv.supabase.co"

    updated = 0
    for annale in data["annales"]:
        aid = annale["id"]
        if aid not in URLS:
            continue
        sujets, corriges = URLS[aid]
        annale["urls_sujets"] = sujets[:3]
        annale["urls_corriges"] = corriges[:3]
        updated += 1

    path.write_text(json.dumps(data, ensure_ascii=False, indent=2))
    print(f"✅ {updated} épreuves mises à jour avec des URLs réelles dans {path}")


if __name__ == "__main__":
    main()
