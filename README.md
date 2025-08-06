# GreenerTech
<img width="1366" height="641" alt="screencapture-greenertech-mywire-org-3000-login-2025-08-06-01_58_26" src="https://github.com/user-attachments/assets/b463234f-d5e5-4773-942d-7e895381f35d" />

## 1. Cloner le projet

Pour cloner le dépôt du projet, ouvrez un terminal et exécutez :

```bash
git clone https://github.com/GreenerTechProject/GreenerTech.git
# ou avec SSH
git clone git@github.com:GreenerTechProject/GreenerTech.git

cd GreenerTech
```

---

## 2. Lancer le projet avec Docker

### 2.1. Pré-requis

Assurez-vous que Docker est installé sur votre machine.

### 2.2. Télécharger le modèle d’IA

```bash
sh download_ia_model.sh
```

### 2.3. Démarrer ou redémarrer le projet

```bash
sh start.sh
```

Pour supprimer les volumes avant de lancer :

```bash
docker-compose down -v ; sh start.sh

Ou Lancer manuellement avec Docker Compose :
docker-compose up -d --build
```

### 2.4. Importer la base de données

```bash
cat greenertech_backup.sql | docker exec -i greenertech-db psql -U postgres -d greenertech

Ou Initialiser la base de données (Flask) :
docker exec -it greenertech-backend bash -c "rm -rf migrations && flask db init && flask db migrate -m 'create tables' && flask db upgrade"
```

### 2.5. Arrêter le projet

```bash
docker-compose down
```

### 2.6. Acceder au projet

```bash
http://localhost:3000/inscription-directeur
http://localhost:3000/connexion
POST : http://localhost:5000/api/register
http://localhost:8080/video/
```

---

## 3. Développement (Dev)

```bash
git checkout {branch}
git add .
git commit -m "Commentaire"
git push

# Ou en une seule ligne
git add . ; git commit -m "Update Project" ; git push

# Mettre à jour et redémarrer Docker
git pull ; docker-compose down ; docker-compose up -d --build
```

---

## 4. Mise à jour de la base de données

```bash
docker exec -it greenertech-backend bash -c "flask db migrate -m 'update tables' && flask db upgrade"
```

---

## 5. Exporter la base de données

```bash
docker exec -t greenertech-db pg_dump -U postgres -d greenertech > greenertech_backup.sql
```

---

## 6. Accès au shell PostgreSQL dans Docker

### Étape 1 : Trouver le conteneur PostgreSQL

```bash
docker ps

Ou :
docker ps -a
docker logs <containerID>
```

Recherchez un conteneur nommé `greenertech-db` ou une image `postgres`.

---

### Étape 2 : Accéder au shell du conteneur

```bash
docker exec -it greenertech-backend bash
```

Si votre conteneur est basé sur Alpine (pas de bash) :

```bash
docker exec -it greenertech-backend sh
```

---

### Étape 3 : Connexion à PostgreSQL

Dans le conteneur, lancez :

```bash
psql -U <utilisateur> -d <nom_base>
```

Exemple avec les paramètres par défaut :

```bash
psql -U postgres -d postgres
```

---

### Astuce : connexion rapide sans shell

```bash
docker exec -it greenertech-db psql -U postgres -d postgres
```

Puis dans psql :

```sql
\c greenertech
\dt
SELECT * FROM users;
```

---

## 7. Commandes utiles PostgreSQL (`psql`)

### Meta-commandes (dans le shell psql, commencent par `\`)

| Commande           | Description                              |
| ------------------ | ---------------------------------------- |
| `\l` ou `\list`    | Liste toutes les bases de données        |
| `\c <dbname>`      | Se connecter à une base de données       |
| `\dt`              | Liste les tables du schéma actuel        |
| `\d <table>`       | Décrit une table (colonnes, types, etc.) |
| `\du`              | Liste les rôles (utilisateurs)           |
| `\dn`              | Liste les schémas                        |
| `\df`              | Liste les fonctions                      |
| `\x`               | Active/désactive l’affichage étendu      |
| `\q`               | Quitter le shell                         |
| `\conninfo`        | Affiche les infos de connexion           |
| `\password <user>` | Change le mot de passe                   |
| `\e`               | Ouvre l’éditeur pour écrire des requêtes |
| `\! <commande>`    | Exécute une commande shell depuis psql   |

---



copie le pdf 
docker cp greenertech-backend:/app/static C:\Users\pc\Desktop\

### Commandes SQL utiles

| Action                         | Commande SQL                                                 |
| ------------------------------ | ------------------------------------------------------------ |
| Afficher la base courante      | `SELECT current_database();`                                 |
| Afficher l’utilisateur courant | `SELECT current_user;`                                       |
| Lister toutes les tables (SQL) | `SELECT tablename FROM pg_tables WHERE schemaname='public';` |
| Lister toutes les bases (SQL)  | `SELECT datname FROM pg_database;`                           |
| Voir les connexions actives    | `SELECT * FROM pg_stat_activity;`                            |

