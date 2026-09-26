# RUNBOOK — SimulHeures (dépôt tonytonic/hs)

Fiche « quoi faire quand ça casse ». Courte exprès. Les scripts expliquent déjà leur *pourquoi* ; ici, c'est le *quoi faire*.
Dernière mise à jour : 22/09/2026.

---

## 1. Qui est où

| Quoi | Où |
|---|---|
| L'appli (menu, 8 modules, 105 outils, GrillePaye) | branche **`Android-cloudfare-production`** |
| La tâche planifiée `verification.yml` | branche **`main`** (branche par défaut : GitHub ne lance les tâches planifiées que d'ici) |
| Le site en ligne | Cloudflare Pages, redéployé à chaque push sur la branche de production |
| L'appli Android | Play Store `com.tonytonic.heuressup` (TWA) : elle affiche le site, elle ne contient pas le code |
| Le lien site ↔ appli Android | `.well-known/assetlinks.json` (+ `_config.yml` qui l'inclut) — **ne jamais supprimer ni renommer** |
| Le fonds juridique | `anthonychauvel/droit` (autre compte, public) |
| Le tableau de bord de veille | `anthonychauvel/tableaudebord` (public) |

Toutes les données des utilisateurs sont dans leur téléphone (localStorage). Rien côté serveur : aucune panne ne peut effacer leurs données, et aucun déploiement ne peut les réparer.

---

## 2. Déployer

1. Pousser les fichiers sur `Android-cloudfare-production` (éditeur web GitHub).
2. Cloudflare redéploie tout seul en 1 à 2 minutes.
3. **Si un fichier a été ajouté ou modifié** : dans `sw.js`, incrémenter `CACHE_NAME` (ex. `v10.10.58` → `v10.10.59`). Sans ça, les téléphones gardent l'ancienne version.
4. **Si un NOUVEAU fichier a été créé** (page, script, image) : l'ajouter aussi à `FILES_TO_CACHE` dans `sw.js`.
   Oubli = la page ne s'ouvre pas hors ligne et, dans l'appli Android, la navigation retombe en silence sur le menu. C'est déjà arrivé deux fois (`nouveautes.html`, puis `taiko.html`).
5. Vérifier sur le téléphone : fermer complètement l'appli, la rouvrir (le nouveau `sw.js` prend la main à la 2ᵉ ouverture).

Fichiers à ne pas casser : `_headers` (interdit de mettre `sw.js` en cache), `_redirects` (URL courtes des modules), `manifest.json`.

---

## 3. Revenir en arrière

**Le plus rapide (le site est cassé, là, maintenant)**
Cloudflare → Pages → le projet → *Deployments* → choisir le dernier déploiement qui marchait → *Rollback to this deployment*. Instantané, sans toucher au dépôt.
Ensuite seulement, corriger le dépôt (sinon le prochain push remet la panne).

**Corriger dans le dépôt**
GitHub → le fichier fautif → *History* → ouvrir la bonne version → copier son contenu → éditer le fichier actuel → coller → commit. Puis incrémenter `CACHE_NAME`.

---

## 4. `verification.yml` (branche main) — chaque mercredi 07:07 UTC

Se lance aussi à la main : Actions → Vérification → Run workflow.

| Étape | Ce qu'elle fait | Écrit quelque chose ? |
|---|---|---|
| 1.1 | Santé des grilles (sous le SMIC, > 18 mois, placeholders, liens morts) | non |
| 1.2 | Cohérence des listes CCN entre fichiers + référentiel DARES | non |
| 1.3 | Aperçu du tableau de suivi | non |
| 1.5 | Régénère `GrillePaye/suivi-public.json` + `tracking-ccn.csv` | **oui**, commit sur la branche de production, seulement si le contenu a changé |
| 1.4 | Veille par dates (verifier-fraicheur.py) | non, indicatif |
| 1.6 | Veille par le tableau de bord (lit `donnees.json`) | non |
| 2.1 | MonLegiTexte reste hors index (`noindex` + `robots.txt`) | non |
| Ticket | Nouveau ticket `veille-grilles` s'il y a des alertes de grille **jamais signalées** | ticket GitHub |

**Le ticket garde la mémoire des alertes déjà vues** dans une ligne invisible en bas de son texte (`<!-- vus:… -->`). Si tu édites un ticket à la main, ne l'efface pas. Pour faire taire une alerte traitée : `exceptions.json` du tableau de bord.

**Si le run est rouge ou incomplet** : ouvrir le run → l'étape en rouge.

| Symptôme | Cause habituelle | Quoi faire |
|---|---|---|
| « Le dépôt du fonds n'a pas pu être lu » | nom de dépôt faux, dépôt passé en privé, panne GitHub | vérifier `anthonychauvel/droit` ; relancer plus tard |
| 1.6 « donnees.json illisible » | tableau de bord pas encore régénéré, ou dépôt renommé | vérifier `anthonychauvel/tableaudebord` ; la veille reprend la semaine suivante |
| 1.6 « 0 alertes grilles » alors que le tableau de bord en montre | format de `donnees.json` changé | adapter la lecture dans l'étape 1.6 |
| 1.5 échoue au `git push` | branche protégée, ou permission `contents: write` retirée | remettre `permissions: contents: write` en tête du fichier |
| Rien ne s'est lancé un mercredi | GitHub saute parfois un run planifié sous forte charge | lancer à la main. C'est pour limiter ça que l'heure est à la minute :07, jamais pile |
| Avertissement « Node.js 20 is deprecated » | versions anciennes de checkout / setup-python / upload-artifact | sans conséquence ; monter les versions quand ça bloquera |

---

## 5. Gestes courants

**Revalorisation du SMIC** (probable au 01/01/2027)
1. `GrillePaye/index.html` : `SMIC_DEF`, `SDATE_DEF`, `SSRC_DEF`.
2. `GrillePaye/ccn-data.json` : `_smic`, `_smic_date` (et remettre `_B64` identique, voir ci-dessous).
3. `sw.js` : `CACHE_NAME`.
Aucune ligne de grille à reprendre : les lignes au plancher (champs `cv` / `sm`) suivent toutes seules.

**Mettre à jour une grille**
1. Relire les montants dans `droit/output/ccn/<IDCC>.json` (texte en vigueur étendu).
2. Tout montant mensuel sous le SMIC : garder le montant conventionnel dans `cv`, l'appli affiche le SMIC.
3. `ccn-data.json` s'écrit sur une seule ligne, sans retour à la ligne final. 573 (alimentaire) et 5730 (non alimentaire) sont deux tableaux distincts, volontairement.
4. `_B64` dans `GrillePaye/index.html` = base64 de `json.dumps(grilles, ensure_ascii=False)` : doit rester identique à `ccn-data.json`. Ne pas utiliser `gen_clean.js` (chemins en dur, régénère tout le bloc).
5. `suivi-public.json` et `tracking-ccn.csv` : régénérés par la tâche du mercredi (étape 1.5), ou à la main avec `--ecrire`.

**Ajouter une convention à GrillePaye** : une ligne dans `const CCN_ALL` (`[IDCC, "nom", "secteur", "régime HS"]`). Le secteur décide des filtres (Industrie, Finance…) : prendre un mot que les filtres connaissent.

---

## 6. Règles produit à ne pas oublier

- Aucun serveur, aucun compte, aucune collecte. Pas de traceur dans l'appli.
- Neutre et indicatif : jamais une somme due, jamais un avis sur la situation de quelqu'un.
- Pas de notification : les rappels passent par le calendrier de l'utilisateur.
- MonLegiTexte reste hors index.
