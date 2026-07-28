import { useRef, useState } from "react";
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

export default function App() {
  const inputRef = useRef(null);
  const fileRef = useRef(null);
  const [chat, setChat] = useState([]);
  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const effacerImage = () => {
    setSelectedFile(null);
    setImagePreview(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const send = async () => {
    const text = inputRef.current.value.trim();
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
        setChat((prev) => [...prev, { role: "Radin", content: data?.data ?? "" }]);
      } catch (e) {
        setChat((prev) => [...prev, { role: "Radin", content: "Error: AI service (image)" }]);
      } finally {
        setLoading(false);
        inputRef.current.value = "";
        effacerImage();
      }
      return;
    }
    
    //Sinon, envoyer la requête normale avec le texte uniquement
    setChat((prev) => [...prev, { role: "Toi", content: text }]);
    inputRef.current.value = "";
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
            <Typography
              component="span"
              fontWeight="bold"
              color={m.role === "Toi" ? "success.main" : "primary.main"}
            >
              {m.role}:
            </Typography>{" "}
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
          onKeyDown={(e) => e.key === "Enter" && send()}
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