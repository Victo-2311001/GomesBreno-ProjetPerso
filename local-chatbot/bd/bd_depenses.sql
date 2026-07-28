CREATE TABLE categories (
  id INTEGER PRIMARY KEY AUTO_INCREMENT,
  nom TEXT NOT NULL UNIQUE
);

CREATE TABLE depenses (
  id INTEGER PRIMARY KEY AUTO_INCREMENT,
  montant REAL NOT NULL,
  categorie_id INTEGER NOT NULL,
  date TEXT NOT NULL,           -- format 'AAAA-MM-JJ'
  marchand TEXT,
  description TEXT,
  image_path TEXT,
  FOREIGN KEY (categorie_id) REFERENCES categories(id)
);

INSERT INTO categories (nom) VALUES
  ('Nourriture'),
  ('Essence'),
  ('Sport'),
  ('Loisirs'),
  ('Voiture'),
  ('Logement'),
  ('Santé'),
  ('Autre');