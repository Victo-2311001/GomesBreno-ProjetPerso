import { useEffect, useRef, useState, type ChangeEvent, type KeyboardEvent } from "react";
import axios from "axios";
import {
  Box, Paper, TextField, Button, IconButton, Typography, CircularProgress,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Select, MenuItem,
} from "@mui/material";
import PhotoCameraIcon from "@mui/icons-material/PhotoCamera";
import CloseIcon from "@mui/icons-material/Close";

const API_BASE = "http://localhost:3001";

type DepenseExtraite = {
  montant: number | null;
  categorie: string;
  date: string | null;
  marchand: string | null;
  description: string | null;
};

type Category = { id: number; nom: string };

type ChatMessage = {
  role: "Toi" | "Radin";
  content: string;
  image?: string | null;
  depenses?: DepenseExtraite[] | null;  
  enregistre?: boolean;
};

export default function Chat() {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [chat, setChat] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const promptRef = useRef<HTMLInputElement | null>(null);

  const [categories, setCategories] = useState<Category[]>([]);

  //Récupérer les catégories
  useEffect(() => {
    axios.get<Category[]>(`${API_BASE}/categories`)
      .then(({ data }) => setCategories(data));
  }, []);

  //Fonction pour gérer le changement de fichier sélectionné
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  //Fonction pour effacer l'image sélectionnée
  const effacerImage = () => {
    setSelectedFile(null);
    setImagePreview(null);
    if (fileRef.current) {
      fileRef.current.value = "";
    }
  };

  //Fonction pour modifier une dépense extraite par l'IA dans le chat
  const modifierDepense = (
    indexMessage: number,
    indexDepense: number,
    champ: keyof DepenseExtraite,
    valeur: any
  ) => {
    setChat((prev) => {
      const copy = [...prev];
      const message = { ...copy[indexMessage] };
      const depenses = [...(message.depenses ?? [])];
      depenses[indexDepense] = { ...depenses[indexDepense], [champ]: valeur };
      message.depenses = depenses;
      copy[indexMessage] = message;
      return copy;
    });
  };

  //Fonction pour envoyer le message (texte ou image) à l'API
  const send = async () => {
    const text = selectedFile
    ? promptRef.current?.value.trim() ?? ""
    : inputRef.current?.value.trim() ?? "";
    //Si aucun texte ni image n'est fourni, ne rien faire
    if (!text && !selectedFile) return;

    //Si une image est sélectionnée, envoyer la requête avec l'image
    if (selectedFile) {
      setChat((prev) => [
        ...prev,
        { role: "Toi", content: text || "(image envoyée)", image: imagePreview },
      ]);
      setLoading(true);

      const formData = new FormData();
      formData.append("image", selectedFile);
      formData.append("content", text);

      try {
        const { data } = await axios.post(`${API_BASE}/chat-image`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        //Juste pour récuperer la réponse json de l'API, on formate le contenu pour l'afficher correctement
        const contenuFormatte =  Array.isArray(data?.data) || typeof data?.data === "object"
          ? JSON.stringify(data.data, null, 2)
          : data?.data ?? "";

        const depensesExtraites = Array.isArray(data?.data) ? data.data : null;

        setChat((prev) => [...prev,     { role: "Radin", content: contenuFormatte, depenses: depensesExtraites, enregistre: false },]);
      } catch (e) {
        setChat((prev) => [...prev, { role: "Radin", content: "Error: AI service (image)" }]);
      } finally {
        setLoading(false);
        if (inputRef.current) {
          inputRef.current.value = "";
        }
        effacerImage();
      }
      return;
    }
    
    //Sinon, envoyer la requête normale avec le texte uniquement
    setChat((prev) => [...prev, { role: "Toi", content: text }]);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
    setLoading(true);

    try {
      const { data } = await axios.post(`${API_BASE}/chat`, { content: text });
      setChat((prev) => [...prev, { role: "Radin", content: data?.data ?? "" }]);
    } catch (e) {
      setChat((prev) => [...prev, { role: "Radin", content: "Error: AI service" }]);
    } finally {
      setLoading(false);
    }
  };

  //Fonction pour enregistrer les dépenses extraites par l'IA dans la base de données
  const enregistrerDepenses = (index: number, depenses: any[]) => {
  axios.post(`${API_BASE}/depenses/add`, { depenses })
    .then(() => {
      setChat((prev) => {
        const copy = [...prev];
        copy[index] = { ...copy[index], enregistre: true };
        return copy;
      });
    })
    .catch((err) => {
      console.error(err);
      alert("Erreur lors de l'enregistrement des dépenses.");
    });
};

  return (
    <Box sx={{ maxWidth: 680, margin: "40px auto", fontFamily: "system-ui, sans-serif" }}>
      <Typography variant="h4" gutterBottom>
        Radin AI
      </Typography>

      <Paper variant="outlined" sx={{ p: 2, minHeight: 200 }}>
        {chat.map((m, i) => (
          <Box key={i} sx={{ mb: 1 }}>
            <Box
              component="span"
              sx={{ fontWeight: "bold", color: m.role === "Toi" ? "success.main" : "primary.main" }}
            >
              {m.role}:
            </Box>{" "}
            {m.depenses && m.depenses.length > 0 ? (
              <TableContainer component={Paper} variant="outlined" sx={{ mt: 1 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Montant</TableCell>
                      <TableCell>Catégorie</TableCell>
                      <TableCell>Date</TableCell>
                      <TableCell>Marchand</TableCell>
                      <TableCell>Description</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {m.depenses.map((d, j) => (
                      <TableRow key={j}>
                        <TableCell>
                          <TextField
                            type="number"
                            size="small"
                            value={d.montant ?? ""}
                            onChange={(e) => modifierDepense(i, j, "montant", parseFloat(e.target.value))}
                            sx={{ width: 90 }}
                          />
                        </TableCell>
                        <TableCell>
                          <Select
                            size="small"
                            value={d.categorie ?? ""}
                            onChange={(e) => modifierDepense(i, j, "categorie", e.target.value)}
                          >
                            {categories.map((c) => (
                              <MenuItem key={c.id} value={c.nom}>{c.nom}</MenuItem>
                            ))}
                          </Select>
                        </TableCell>
                        <TableCell>
                          <TextField
                            type="date"
                            size="small"
                            value={d.date ?? ""}
                            onChange={(e) => modifierDepense(i, j, "date", e.target.value)}
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            size="small"
                            value={d.marchand ?? ""}
                            onChange={(e) => modifierDepense(i, j, "marchand", e.target.value)}
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            size="small"
                            value={d.description ?? ""}
                            onChange={(e) => modifierDepense(i, j, "description", e.target.value)}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Typography component="span" sx={{ whiteSpace: "pre-wrap" }}>
                {m.content}
              </Typography>
            )}
            {m.image && (
              <Box sx={{ mt: 0.5 }}>
                <img
                  src={m.image}
                  alt="upload"
                  style={{ maxWidth: 200, borderRadius: 6 }}
                />
              </Box>
            )}
            {m.depenses && m.depenses.length > 0 && (
              <Box sx={{ mt: 1 }}>
                {m.enregistre ? (
                  <Typography variant="body2" color="success.main">
                    ✓ {m.depenses.length} dépense(s) enregistrée(s)
                  </Typography>
                ) : (
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => enregistrerDepenses(i, m.depenses!)}
                  >
                    Enregistrer {m.depenses.length} dépense(s) dans la BD
                  </Button>
                )}
              </Box>
            )}
          </Box>
        ))}
        {loading && (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <CircularProgress size={16} />
            <Typography variant="body2">
              <em>Attend un peu…</em>
            </Typography>
          </Box>
        )}
      </Paper>

      {imagePreview && (
        <Box sx={{ mt: 1.5, display: "flex", alignItems: "center", gap: 1 }}>
          <img src={imagePreview} alt="preview" style={{ maxWidth: 120, borderRadius: 6 }} />
          <Button size="small" startIcon={<CloseIcon />} onClick={effacerImage}>
            Retirer l'image
          </Button>
        </Box>
      )}

      <Box sx={{ display: "flex", gap: 1, mt: 1.5, alignItems: "flex-start" }}>
        {imagePreview ? (
          <TextField
            inputRef={promptRef}
            label="Instruction supplémentaire (optionnel)"
            fullWidth
            multiline
            minRows={2}
            size="small"
          />
        ) : (
          <TextField
            inputRef={inputRef}
            placeholder="Tu veux quoi?"
            fullWidth
            size="small"
            onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => {
              if (e.key === "Enter") {
                e.preventDefault();
                void send();
              }
            }}
          />
        )}
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          style={{ display: "none" }}
          id="file-input"
        />
        <label htmlFor="file-input">
          <IconButton component="span" color="primary">
            <PhotoCameraIcon />
          </IconButton>
        </label>
        <Button variant="contained" onClick={send}>
          Envoyer
        </Button>
      </Box>

      <Typography variant="body2" color="text.secondary">
        <em>Note: L'IA peut parfois se tromper...</em>
      </Typography>
    </Box>
  );
}

//Consultation du site: https://jsdev.space/local-ai-ollama-react/ pour l'intégration de l'IA