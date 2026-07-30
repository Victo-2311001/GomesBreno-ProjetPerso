  import express from "express";
  import cors from "cors";
  import morgan from "morgan";
  import axios from "axios";
  import dotenv from "dotenv";
  import multer from "multer";
  import pool from "./db.js";

  dotenv.config();

  const app = express();
  const PORT = process.env.PORT;
  const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL;
  const MODEL = process.env.MODEL;
  const upload = multer({ storage: multer.memoryStorage() });

  app.use(cors());               
  app.use(express.json());   
  app.use(morgan("dev"));     

  //Voir si le server est en ligne et le modèle utilisé
  app.get("/health", (req, res) => {
    res.json({ ok: true, model: MODEL });
  });


  //=======================
  //Routes AI 
  //=======================

  //Chat normal (texte uniquement)
  app.post("/chat", async (req, res) => {
    try {
      const userMessage = req.body?.content ?? "";
      if (!userMessage) {
        return res.status(400).json({ error: "Missing 'content' in body" });
      }

      //Payload pour l'API Ollama
      const payload = {
        model: MODEL,
        think: false,
        messages: [{ role: "user", content: userMessage }],
        stream: false,
      };

      //Appel à l'API Ollama
      const { data } = await axios.post(`${OLLAMA_BASE_URL}/api/chat`, payload, {
        timeout: 120_000,
      });

      //Réponse à l'utilisateur
      res.json({
        code: 1,
        data: data?.message?.content ?? "",
      });
    } catch (err) {
      console.error(err?.response?.data || err.message);
      res.status(500).json({ error: "AI service error" });
    }
  });

  //Chat avec image
  app.post("/chat-image", upload.single("image"), async (req, res) => {
    try {
      const file = req.file;
      const instructionUtilisateur = req.body?.content ?? "";

      //Vérifier si photo existe
      if (!file) {
        return res.status(400).json({ error: "Aucune 'image' file in form-data" });
      }
      
    //Va chercher les catégories existantes pour ajouter dans le prompt
    const [categories] = await pool.query("SELECT nom FROM categories");
    const listeCategories = categories.map(categories => categories.nom).join(", ");

      const promptSysteme =
      `Tu es un extracteur de données financières. Cette image peut contenir UNE SEULE dépense (reçu) OU une LISTE de plusieurs transactions (historique bancaire).

      IMPORTANT: Compte D'ABORD combien de transactions distinctes sont visibles dans l'image. Ensuite, retourne un tableau JSON avec EXACTEMENT un élément par transaction trouvée — même s'il y en a 5, 10, ou plus. Ne résume JAMAIS plusieurs transactions en une seule, sauf si l'image est un seul reçu détaillé représentant un seul achat total.
      IMPORTANT: Je veux SEULEMENT les dépenses. Si l'image contient des revenus, ignore-les. Si l'image contient des dépenses et des revenus, retourne seulement les dépenses.  
      Choisis la categorie parmi cette liste exacte: ${listeCategories}

      Exemple avec 2 transactions:
      [
        { "montant": 1.71, "categorie": "Épicerie", "date": "2026-07-28", "marchand": "Depanneur Lafon", "description": "Achat dépanneur" },
        { "montant": 40.00, "categorie": "Essence", "date": "2026-07-28", "marchand": "Ultramar", "description": "Plein d'essence" }
      ]

      Si une information est illisible ou absente, utilise null pour ce champ.
      ${instructionUtilisateur ? `\n\nInstruction supplémentaire de l'utilisateur (à respecter en plus des règles ci-dessus): ${instructionUtilisateur}` : ""}`;

      //Ollama veut les images en base64
      const base64Image = file.buffer.toString("base64");

      //Schéma JSON pour valider la réponse de l'IA
      const schema = {
        type: "array",
        items: {
          type: "object",
          properties: {
            montant: { type: ["number", "null"] },
            categorie: { type: "string" },
            date: { type: ["string", "null"] },
            marchand: { type: ["string", "null"] },
            description: { type: ["string", "null"] },
          },
          required: ["montant", "categorie", "date", "marchand", "description"],
        },
      };

      //Payload pour l'API Ollama
      const payload = {
        model: MODEL,
        think: false,
        messages: [
          {
            role: "user",
            content: promptSysteme,
            images: [base64Image],
          },
        ],
        stream: false,
        format: schema, 
        options: {
          num_ctx: 16384,
        },
      };

      //Log pour debug et vérifier que l'image est bien reçue
      console.log("Fichier reçu:", file ? `${file.originalname}, ${file.size} bytes, type: ${file.mimetype}` : "AUCUN FICHIER");
      console.log("Longueur base64:", base64Image?.length);   
      
      //Appel à l'API Ollama
      const { data } = await axios.post(`${OLLAMA_BASE_URL}/api/chat`, payload, {
        timeout: 360_000, //Les images prennent plus de temps à traiter
      });

      //Log pour debug et vérifier la réponse brute de l'IA
      const brut = data?.message?.content ?? "[]";
   
      console.log("=== Réponse brute de l'IA ===");
      console.log(brut);
      console.log("================================");

      //Parse la réponse brute en JSON et s'assure que c'est un tableau pour faire l'insertion dans la base de données après
      let resultat = JSON.parse(brut);

      //Si la réponse n'est pas un tableau, on la transforme en tableau pour éviter les erreurs lors de l'insertion dans la base de données
      if (!Array.isArray(resultat)) {
        resultat = [resultat];
      }

      //Réponse à l'utilisateur
      res.json({
        code: 1,
        data:resultat,
      });
    } catch (err) {
      console.error(err?.response?.data || err.message);
      res.status(500).json({ error: "AI service error" });
    }
  });

  //=======================
  //Routes bd 
  //=======================

  //Récupérer toutes les catégories
  app.get("/categories", async (req, res) => {
    try {
      const [rows] = await pool.query("SELECT * FROM categories");
      res.json(rows);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Erreur base de données" });
    }
  });

  //Ajouter une nouvelle catégorie
  app.post("/categories/add", async (req, res) => {
    try {
      const nom  = req.body.nom;
      const [result] = await pool.query(
        "INSERT INTO categories (nom) VALUES (?)",
        [nom]
      );
      res.json({ id: result.insertId, nom});
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Erreur insertion" });
    }
  });

  //Récupérer toutes les dépenses
  app.get("/depenses", async (req, res) => {
    try {
      const [rows] = await pool.query(`
        SELECT 
          depenses.id,
          depenses.montant,
          categories.nom AS categorie,
          depenses.date,
          depenses.marchand,
          depenses.description
        FROM depenses
        JOIN categories ON depenses.categorie_id = categories.id
        ORDER BY depenses.date DESC
      `);
      res.json(rows);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Erreur récupération dépenses" });
    }
  });

  //Démarrage du serveur
  app.listen(PORT, () => {
    console.log(`Express API: http://localhost:${PORT}`);
  });
  
//Consultation du site: https://jsdev.space/local-ai-ollama-react/ pour l'intégration de l'IA