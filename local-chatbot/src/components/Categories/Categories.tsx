import { useEffect, useState } from "react";
import axios from "axios";
import { List, ListItem, ListItemText, Paper, TextField, Typography } from "@mui/material";

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

  //Fonction pour ajouter une nouvelle catégorie
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
    <Paper sx={{ maxWidth: 400, margin: "20px auto", padding: 2 }}>
      <Typography variant="h6">Catégories</Typography>
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
          />
        <button onClick={AjouterCategorie}>Ajouter une catégorie</button>
    </Paper>
  );
}