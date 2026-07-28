DROP DATABASE IF EXISTS projet_radin;
CREATE DATABASE projet_radin;
USE projet_radin;

CREATE TABLE categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nom VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE depenses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  montant DECIMAL(10,2) NOT NULL,
  categorie_id INT NOT NULL,
  date DATE NOT NULL,
  marchand VARCHAR(100),
  description TEXT,
  image_path VARCHAR(255),
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