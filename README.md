# GreenerTech
GreenerTech

## Comment cloner le projet

Pour cloner le dépôt du projet, exécutez la commande suivante dans votre terminal :
```bash
git clone https://github.com/GreenerTechProject/GreenerTech.git
ou
git clone git@github.com:GreenerTechProject/GreenerTech.git

cd GreenerTech
```

Comment lancer le projet avec Docker

Assurez-vous d’avoir Docker installé sur votre machine. Ensuite, vous pouvez construire et lancer le conteneur Docker de la façon suivante :
```bash
docker-compose up -d --build
```

Pour arrêter le projet :
```bash
docker-compose down -v
```

Pour le Dev : 
```bash
git checkout {branch}
git add .
git commit -m "Comment"
git push

git pull ; docker-compose down -v ; docker-compose up -d --build
git add . ; git commit -m "Update Project" ; git push

rm -rf migrations ; flask db init ; flask db migrate -m "create users table" ; flask db upgrade

```


------------
------------
------------
------------

To access the **PostgreSQL shell** inside your Docker container, follow these steps:

---

### ✅ **Step 1: Find your PostgreSQL container name**

Run:

```bash
docker ps
```

Look for a container with a name like `greenertech-db` or image like `postgres`.

---

### ✅ **Step 2: Access the container shell**

```bash
docker exec -it greenertech-db bash
```

*If it's Alpine-based (no bash), use:*

```bash
docker exec -it greenertech-db sh
```

---

### ✅ **Step 3: Connect to PostgreSQL**

Inside the container, run:

```bash
psql -U <username> -d <database_name>
```

For example, if you used the default settings:

```bash
psql -U postgres -d postgres
```

> `-U`: PostgreSQL user
> `-d`: Database name

---

### 📌 Full one-liner (skip container shell):

If you just want to run `psql` directly:

```bash
docker exec -it greenertech-db psql -U postgres -d postgres
```

---



Here’s a **complete and categorized reference** of the most useful PostgreSQL (`psql`) **commands**, both in the **interactive shell** and general SQL.

---

## 🟢 **Connecting**

```bash
psql -U <user> -d <dbname>
```

---

## 📘 **Meta-Commands (psql shell only)**

*(start with a backslash `\`)*

| Command            | Description                                    |
| ------------------ | ---------------------------------------------- |
| `\l` or `\list`    | List all databases                             |
| `\c <dbname>`      | Connect to a database                          |
| `\dt`              | List all tables in the current schema          |
| `\d <table>`       | Describe a table (columns, types, etc.)        |
| `\du`              | List roles (users)                             |
| `\dn`              | List schemas                                   |
| `\df`              | List functions                                 |
| `\x`               | Toggle expanded output (useful for large data) |
| `\q`               | Quit the shell                                 |
| `\conninfo`        | Show current connection info                   |
| `\password <user>` | Change password                                |
| `\e`               | Open editor to write long queries              |
| `\! <command>`     | Run a shell command from within `psql`         |

---

## 📗 **SQL Commands (within `psql`)**

### 🔹 Database

```sql
CREATE DATABASE mydb;
DROP DATABASE mydb;
\c mydb;  -- connect
```

### 🔹 User

```sql
CREATE USER myuser WITH PASSWORD 'secret';
GRANT ALL PRIVILEGES ON DATABASE mydb TO myuser;
ALTER USER myuser WITH SUPERUSER;
DROP USER myuser;
```

### 🔹 Table

```sql
CREATE TABLE mytable (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    age INT
);

ALTER TABLE mytable ADD COLUMN email TEXT;
DROP TABLE mytable;
TRUNCATE TABLE mytable;
```

### 🔹 Data

```sql
INSERT INTO mytable (name, age) VALUES ('Ali', 30);
SELECT * FROM mytable;
UPDATE mytable SET age = 31 WHERE name = 'Ali';
DELETE FROM mytable WHERE id = 1;
```

### 🔹 Indexes

```sql
CREATE INDEX idx_name ON mytable(name);
DROP INDEX idx_name;
```

---

## 📙 **Backup & Restore**

### Dump:

```bash
pg_dump -U <user> -d <dbname> > backup.sql
```

### Restore:

```bash
psql -U <user> -d <dbname> < backup.sql
```

---

## 📓 Extras

| Action                   | Command                                                      |
| ------------------------ | ------------------------------------------------------------ |
| List current database    | `SELECT current_database();`                                 |
| Show current user        | `SELECT current_user;`                                       |
| List all tables (SQL)    | `SELECT tablename FROM pg_tables WHERE schemaname='public';` |
| List all databases (SQL) | `SELECT datname FROM pg_database;`                           |
| View active connections  | `SELECT * FROM pg_stat_activity;`                            |

---



-------------
-------------
-------------
-------------


### ✅ 3. **Create Migration Folder**

Run the following to initialize migrations:

```bash
flask db init
```

This will create a `migrations/` folder.

---

### ✅ 4. **Generate Migration Script**

After defining or updating models in `models/`, run:

```bash
flask db migrate -m "Initial migration"
```

This generates a migration script in `migrations/versions/`.

---

### ✅ 5. **Apply Migration to PostgreSQL**

Apply the generated schema to your database:

```bash
flask db upgrade
```
