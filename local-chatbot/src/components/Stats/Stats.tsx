import { useEffect, useState } from "react";
import { Box, Typography, TextField, Paper, Grid, IconButton, Select, MenuItem, FormControl, InputLabel, Checkbox} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
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
  pourQuelquUnAutre: boolean;
};

type Category = { id: number; nom: string };

export default function Stats() {
  const [depenses, setDepenses] = useState<Depense[]>([]);
  const [moisSelectionne, setMoisSelectionne] = useState<string>(
    new Date().toISOString().slice(0, 7)
  );

  //Catégorie actuellement sélectionnée pour le dialog (null = fermé)
  const [categorieSelectionnee, setCategorieSelectionnee] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);

  //Variables pour l'édition d'une dépense
  const [depenseEnEdition, setDepenseEnEdition] = useState<Depense | null>(null);
  const [montantEdit, setMontantEdit] = useState("");
  const [marchandEdit, setMarchandEdit] = useState("");
  const [descriptionEdit, setDescriptionEdit] = useState("");
  const [categorieEdit, setCategorieEdit] = useState("");
  const [pourQuelquUnAutreEdit, setPourQuelquUnAutreEdit] = useState(false);


  //Récupérer les dépenses 
  useEffect(() => {
    axios.get<Depense[]>(`${API_BASE}/depenses`)
      .then(({ data }) => { setDepenses(data); });

    axios.get<Category[]>(`${API_BASE}/categories`)
      .then(({ data }) => setCategories(data));
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

  //Chercher la quantité de dépenses par catégorie pour le mois sélectionné
  const quantiteDepensesParCategorie: Record<string, number> = {};
  for (const d of depensesDuMois) {
    if (!quantiteDepensesParCategorie[d.categorie]) {
      quantiteDepensesParCategorie[d.categorie] = 0;
    }
    quantiteDepensesParCategorie[d.categorie] += 1;
  } 

  //Chercher le total des dépenses pour quelqu'un d'autre par catégorie
  let totalPourAutresMensuel = 0;
  for (const d of depensesDuMois) {
    if (d.pourQuelquUnAutre) {
      totalPourAutresMensuel += Number(d.montant);
    }
  }

  const totauxDepensesAutres: Record<string, number> = {};
  for (const d of depensesDuMois) {
    if (d.pourQuelquUnAutre) {
      if (!totauxDepensesAutres[d.categorie]) {
        totauxDepensesAutres[d.categorie] = 0;
      }
      totauxDepensesAutres[d.categorie] += Number(d.montant);
    }
  }
    

  //Chercher le total des dépenses du mois sélectionné
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

  const ouvrirEdition = (d: Depense) => {
    setDepenseEnEdition(d);
    setMontantEdit(String(d.montant));
    setMarchandEdit(d.marchand ?? "");
    setDescriptionEdit(d.description ?? "");
    setCategorieEdit(d.categorie);
    setPourQuelquUnAutreEdit(d.pourQuelquUnAutre);
  };

  const fermerEdition = () => {
    setDepenseEnEdition(null);
  };

  //Sauvegarder les modifications d'une dépense
  const sauvegarderEdition = () => {
    if (!depenseEnEdition) return;

    axios.put(`${API_BASE}/depenses/${depenseEnEdition.id}`, {
      marchand: marchandEdit,
      montant: parseFloat(montantEdit),
      description: descriptionEdit,
      categorie: categorieEdit,
      pourQuelquUnAutre: pourQuelquUnAutreEdit
    }).then(() => {
      //Met à jour la liste locale sans devoir tout recharger
      setDepenses((prev) =>
        prev.map((d) =>
          d.id === depenseEnEdition.id
            ? { ...d, marchand: marchandEdit, montant: parseFloat(montantEdit), description: descriptionEdit, pourQuelquUnAutre: pourQuelquUnAutreEdit }
            : d
        )
      );
      fermerEdition();
    }).catch((err) => {
      console.error(err);
      alert("Erreur lors de la modification.");
    });
  };

  //Supprimer une dépense
  const supprimerDepense = (id: number) => {
    if (!window.confirm("Voulez-vous vraiment supprimer cette dépense ?")) return;

    axios.delete(`${API_BASE}/depenses/${id}`)
      .then(() => {
        //Enlever la dépense de la liste locale sans devoir tout recharger
        setDepenses((prev) => prev.filter((d) => d.id !== id));
      })
      .catch((err) => {
        console.error(err);
        alert("Erreur lors de la suppression.");
      });
  };

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
          <Typography variant="body2" color="text.secondary">
            *Total pour quelqu'un d'autre: {totalPourAutresMensuel.toFixed(2)} $
          </Typography>
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
                <Typography variant="body2" color="text.secondary">
                  {quantiteDepensesParCategorie[categorie]} dépense(s)
                </Typography>
                {totauxDepensesAutres[categorie] !== undefined && (
                  <Typography variant="caption" color="text.secondary">
                    dont {totauxDepensesAutres[categorie].toFixed(2)} $ pour quelqu'un d'autre
                  </Typography>
                )}
              </Button>
            </Paper>
          </Grid>
        ))}

        {Object.keys(totauxParCategorie).length === 0 && (
          <Grid size={12}>
            <Typography color="text.secondary">
              Aucun revenu ou dépense pour ce mois.
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
              <ListItem
                key={d.id}
                divider
                secondaryAction={
                  <Box sx={{ display: "flex", gap: 1 }}>
                    <IconButton edge="end" onClick={() => ouvrirEdition(d)}>
                      <EditIcon />
                    </IconButton>
                    <IconButton edge="end" onClick={() => supprimerDepense(d.id)}>
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                }
              >
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

      <Dialog open={depenseEnEdition !== null} onClose={fermerEdition} fullWidth maxWidth="xs">
        <DialogTitle>Modifier la dépense</DialogTitle>
        <DialogContent dividers sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 2 }}>
          <TextField
            label="Marchand"
            value={marchandEdit}
            onChange={(e) => setMarchandEdit(e.target.value)}
            fullWidth
          />
          <TextField
            label="Montant"
            type="number"
            value={montantEdit}
            onChange={(e) => setMontantEdit(e.target.value)}
            fullWidth
          />
          <FormControl fullWidth>
            <InputLabel>Catégorie</InputLabel>
            <Select
              value={categorieEdit}
              label="Catégorie"
              onChange={(e) => setCategorieEdit(e.target.value)}
            >
              {categories.map((c) => (
                <MenuItem key={c.id} value={c.nom}>
                  {c.nom}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            label="Description"
            value={descriptionEdit}
            onChange={(e) => setDescriptionEdit(e.target.value)}
            fullWidth
            multiline
            minRows={2}
          />
          <Typography variant="body2" color="text.secondary">
            Cochez si la dépense a été faite pour quelqu'un d'autre.
            <Checkbox
              checked={pourQuelquUnAutreEdit}
              onChange={(e) => setPourQuelquUnAutreEdit(e.target.checked)}
            />
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={fermerEdition}>Annuler</Button>
          <Button onClick={sauvegarderEdition} variant="contained">Enregistrer</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

//Utilisation de https://mui.com/material-ui/react-dialog/ pour l'affichage des détails d'une catégorie