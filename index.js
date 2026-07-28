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
      const userMessage = req.body?.content ?? "Décris cette image.";
      const file = req.file;

      if (!file) {
        return res.status(400).json({ error: "Missing 'image' file in form-data" });
      }

      //Ollama veut les images en base64
      const base64Image = file.buffer.toString("base64");

      //Payload pour l'API Ollama
      const payload = {
        model: MODEL,
        think: false,
        messages: [
          {
            role: "user",
            content: userMessage,
            images: [base64Image],
          },
        ],
        stream: false,
        options: {
          num_ctx: 8192,
        },
      };

      //Log pour debug et vérifier que l'image est bien reçue
      console.log("Fichier reçu:", file ? `${file.originalname}, ${file.size} bytes, type: ${file.mimetype}` : "AUCUN FICHIER");
      console.log("Longueur base64:", base64Image?.length);   
      
      //Appel à l'API Ollama
      const { data } = await axios.post(`${OLLAMA_BASE_URL}/api/chat`, payload, {
        timeout: 240_000, // les images prennent plus de temps à traiter
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

  //Démarrage du serveur
  app.listen(PORT, () => {
    console.log(`Express API: http://localhost:${PORT}`);
  });
  
//Consultation du site: https://jsdev.space/local-ai-ollama-react/ pour l'intégration de l'IA