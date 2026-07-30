import { useEffect, useState } from "react";
import { Box, Typography, TextField, Paper, Grid } from "@mui/material";
import axios from "axios";
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';

const API_BASE = "http://localhost:3001";

type Depense = {
  id: number;
  montant: number;
  categorie: string;
  date: string;
  marchand: string | null;
  description: string | null;
};

export default function Stats() {
  const [depenses, setDepenses] = useState<Depense[]>([]);
  const [moisSelectionne, setMoisSelectionne] = useState<string>(
    new Date().toISOString().slice(0, 7)
  );

  //Catégorie actuellement sélectionnée pour le dialog (null = fermé)
  const [categorieSelectionnee, setCategorieSelectionnee] = useState<string | null>(null);

  //Récupérer les dépenses 
  useEffect(() => {
    axios.get<Depense[]>(`${API_BASE}/depenses`)
      .then(({ data }) => { setDepenses(data); });
  }, []);

  const handleClickOpen = (categorie: string) => () => {
    setCategorieSelectionnee(categorie);
  };

  const handleClose = () => {
    setCategorieSelectionnee(null);
  };

  //Filtrer les dépenses du mois sélectionné
  const depensesDuMois: Depense[] = [];
  for (const d of depenses) {
    if (d.date && d.date.startsWith(moisSelectionne)) {
      depensesDuMois.push(d);
    }
  }

  //Grouper les montants par catégorie
  const totauxParCategorie: Record<string, number> = {};
  for (const d of depensesDuMois) {
    if (!totauxParCategorie[d.categorie]) {
      totauxParCategorie[d.categorie] = 0;
    }
    totauxParCategorie[d.categorie] += Number(d.montant);
  }

  //Grouper les montants par mois  
  const totauxMensuels: Record<string, number> = {};
  for (const d of depensesDuMois) {
    if (!totauxMensuels[moisSelectionne]) {
      totauxMensuels[moisSelectionne] = 0;
    }
    totauxMensuels[moisSelectionne] += Number(d.montant);
  }

  //Dépenses de la catégorie actuellement affichée dans le dialog
  const depensesDeLaCategorie: Depense[] = [];
  if (categorieSelectionnee) {
    for (const d of depensesDuMois) {
      if (d.categorie === categorieSelectionnee) {
        depensesDeLaCategorie.push(d);
      }
    }
  }

  return (
    <Box sx={{ maxWidth: 680, margin: "40px auto" }}>
      <Typography variant="h4" gutterBottom>
        Statistiques
      </Typography>

      <TextField
        label="Mois"
        type="month"
        value={moisSelectionne}
        onChange={(e) => setMoisSelectionne(e.target.value)}
        sx={{ mb: 3 }}
      />

      {totauxMensuels[moisSelectionne] !== undefined &&
        <Typography variant="h6" gutterBottom>
          Total: {totauxMensuels[moisSelectionne].toFixed(2)} $
        </Typography>
      }

      <Grid container spacing={2}>
        {Object.entries(totauxParCategorie).map(([categorie, total]) => (
          <Grid key={categorie} size={{ xs: 6, sm: 4 }}>
            <Paper variant="outlined">
              <Button onClick={handleClickOpen(categorie)} sx={{ width: "100%", p: 2, flexDirection: "column" }}>
                <Typography variant="subtitle2" color="text.secondary">
                  {categorie}
                </Typography>
                <Typography variant="h6">{total.toFixed(2)} $</Typography>
              </Button>
            </Paper>
          </Grid>
        ))}

        {Object.keys(totauxParCategorie).length === 0 && (
          <Grid size={12}>
            <Typography color="text.secondary">
              Aucune dépense pour ce mois.
            </Typography>
          </Grid>
        )}
      </Grid>

      <Dialog
        open={categorieSelectionnee !== null}
        onClose={handleClose}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>{categorieSelectionnee}</DialogTitle>
        <DialogContent dividers>
          <List>
            {depensesDeLaCategorie.map((d) => (
              <ListItem key={d.id} divider>
                <ListItemText
                  primary={`${d.marchand ?? "Marchand inconnu"} — ${Number(d.montant).toFixed(2)} $`}
                  secondary={`${d.date}${d.description ? " — " + d.description : ""}`}
                />
              </ListItem>
            ))}

            {depensesDeLaCategorie.length === 0 && (
              <Typography color="text.secondary">
                Aucune dépense trouvée.
              </Typography>
            )}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Fermer</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

//Utilisation de https://mui.com/material-ui/react-dialog/ pour l'affichage des détails d'une catégorie