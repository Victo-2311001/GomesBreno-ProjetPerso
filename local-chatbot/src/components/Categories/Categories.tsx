import { useEffect, useState } from "react";
import axios from "axios";
// AJOUT: Button MUI pour remplacer le <button> HTML natif (juste visuel, même fonction onClick)
import { List, ListItem, ListItemText, Paper, TextField, Typography, Button } from "@mui/material";

type Category = {
  id: number;
  nom: string;
};

const API_BASE = "http://localhost:3001";

export default function Categories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [nouveauNom, setNouveauNom] = useState("");

  useEffect(() => {
    axios.get<Category[]>(`${API_BASE}/categories`)
      .then((res) => setCategories(res.data))
      .catch((err) => console.error(err));
  }, []);

  const AjouterCategorie = () => {
    if (nouveauNom) {
      axios
        .post(`${API_BASE}/categories/add`, { nom: nouveauNom })
        .then((res) => {
          setCategories([...categories, res.data]);
          setNouveauNom("");
        })
        .catch((err) => console.error(err));
    }
  };

  return (
    // AJOUT: fond de carte cohérent avec le thème sombre
    <Paper sx={{ maxWidth: 400, margin: "20px auto", padding: 2, backgroundColor: "background.paper" }}>
      <Typography variant="h4" gutterBottom>
              Catégoriees
      </Typography> 

      <List>
        {categories.map((categorie) => (
          <ListItem key={categorie.id}>
            <ListItemText primary={categorie.nom} />
          </ListItem>
        ))}
      </List>
        
      <Typography>Ajouter catégorie*</Typography>
          <TextField
            value={nouveauNom}
            onChange={(e) => setNouveauNom(e.target.value)}
            slotProps={{ htmlInput: { maxLength: 100 } }}
            placeholder="Nom"
            fullWidth
            // AJOUT: espacement sous le champ pour séparer du bouton
            sx={{ mb: 1, mt: 1 }}
          />
        {/* AJOUT: Button MUI variant="contained" au lieu du <button> HTML natif, même onClick */}
        <Button onClick={AjouterCategorie} variant="contained" fullWidth>
          Ajouter une catégorie
        </Button>
    </Paper>
  );
}