import { useRef, useState, type ChangeEvent, type KeyboardEvent } from "react";
import axios from "axios";
import {
  Box,
  Paper,
  TextField,
  Button,
  IconButton,
  Typography,
  CircularProgress,
} from "@mui/material";
import PhotoCameraIcon from "@mui/icons-material/PhotoCamera";
import CloseIcon from "@mui/icons-material/Close";

const API_BASE = "http://localhost:3001";

type ChatMessage = {
  role: "Toi" | "Radin";
  content: string;
  image?: string | null;
};

export default function Chat() {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [chat, setChat] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const effacerImage = () => {
    setSelectedFile(null);
    setImagePreview(null);
    if (fileRef.current) {
      fileRef.current.value = "";
    }
  };

  const send = async () => {
    const text = inputRef.current?.value.trim() ?? "";
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
      formData.append("content", text || "Décris cette image en détail.");

      try {
        const { data } = await axios.post(`${API_BASE}/chat-image`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        //Juste pour récuperer la réponse json de l'API, on formate le contenu pour l'afficher correctement
        const contenuFormatte =  Array.isArray(data?.data) || typeof data?.data === "object"
          ? JSON.stringify(data.data, null, 2)
          : data?.data ?? "";
        setChat((prev) => [...prev, { role: "Radin", content: contenuFormatte }]);
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
            <Typography component="span" sx={{ whiteSpace: "pre-wrap" }}>
              {m.content}
            </Typography>
            {m.image && (
              <Box sx={{ mt: 0.5 }}>
                <img
                  src={m.image}
                  alt="upload"
                  style={{ maxWidth: 200, borderRadius: 6 }}
                />
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

      <Box sx={{ display: "flex", gap: 1, mt: 1.5 }}>
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
    </Box>
  );
}

//Consultation du site: https://jsdev.space/local-ai-ollama-react/ pour l'intégration de l'IA