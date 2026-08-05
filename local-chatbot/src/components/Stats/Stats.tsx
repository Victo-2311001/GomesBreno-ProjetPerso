import { useEffect, useState } from "react";
import { Box, Typography, TextField, Paper, Grid, IconButton, Select, MenuItem, FormControl, InputLabel, Checkbox} from "@mui/material";
// AJOUT: Chip pour badge visuel "pour quelqu'un d'autre" / "revenu"
import Chip from "@mui/material/Chip";
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
import Depense from "../../types/Depense/Depense";
import Category from "../../types/Category/Category";

const API_BASE = "http://localhost:3001";

export default function Stats() {
  const [depenses, setDepenses] = useState<Depense[]>([]);
  const [moisSelectionne, setMoisSelectionne] = useState<string>(
    new Date().toISOString().slice(0, 7)
  );

  const [categorieSelectionnee, setCategorieSelectionnee] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);

  const [depenseEnEdition, setDepenseEnEdition] = useState<Depense | null>(null);
  const [montantEdit, setMontantEdit] = useState("");
  const [marchandEdit, setMarchandEdit] = useState("");
  const [descriptionEdit, setDescriptionEdit] = useState("");
  const [categorieEdit, setCategorieEdit] = useState("");
  const [pourQuelquUnAutreEdit, setPourQuelquUnAutreEdit] = useState(false);

  const [message, setMessage] = useState<string>("");



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

  const depensesDuMois: Depense[] = [];
  for (const d of depenses) {
    if (d.date && d.date.startsWith(moisSelectionne)) {
      depensesDuMois.push(d);
    }
  }

  const totauxParCategorie: Record<string, number> = {};
  for (const d of depensesDuMois) {
    if (!totauxParCategorie[d.categorie]) {
      totauxParCategorie[d.categorie] = 0;
    }
    
    totauxParCategorie[d.categorie] += Number(d.montant);
  }

  const quantiteDepensesParCategorie: Record<string, number> = {};
  for (const d of depensesDuMois) {
    if (!quantiteDepensesParCategorie[d.categorie]) {
      quantiteDepensesParCategorie[d.categorie] = 0;
    }
    quantiteDepensesParCategorie[d.categorie] += 1;
  } 

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
    

  const totauxMensuels: Record<string, number> = {};
  for (const d of depensesDuMois) {
    if (d.categorie === "Revenus") {
      continue;
    }
    if (!totauxMensuels[moisSelectionne]) {
      totauxMensuels[moisSelectionne] = 0;
    }
    totauxMensuels[moisSelectionne] += Number(d.montant);
  }

  const totauxRevenusMensuels: Record<string, number> = {};
  for (const d of depensesDuMois) {
    if (d.categorie === "Revenus") {  
      if (!totauxRevenusMensuels[moisSelectionne]) {
        totauxRevenusMensuels[moisSelectionne] = 0;
      }
      totauxRevenusMensuels[moisSelectionne] += Number(d.montant);
    }
  }

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
    setMessage("");
  };

  const fermerEdition = () => {
    setDepenseEnEdition(null);
    setMessage("");
  };

  const sauvegarderEdition = () => {
    if (!depenseEnEdition) return;

    //Vérifier que le montant est un nombre positif et que la catégorie n'est pas vide
    const montantValue = parseFloat(montantEdit);
    if (Number.isNaN(montantValue) || montantValue <= 0) {
      setMessage("Montant invalide. Veuillez saisir un montant positif.");
      return;
    }
    if (!categorieEdit || categorieEdit.trim() === "") {
      setMessage("La catégorie est obligatoire.");
      return;
    }

    axios.put(`${API_BASE}/depenses/${depenseEnEdition.id}`, {
      marchand: marchandEdit,
      montant: parseFloat(montantEdit),
      description: descriptionEdit,
      categorie: categorieEdit,
      pourQuelquUnAutre: pourQuelquUnAutreEdit
    }).then(() => {
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
      setMessage("Erreur lors de la mise à jour. Veuillez réessayer.");
    });
  };

  const supprimerDepense = (id: number) => {
    if (!window.confirm("Voulez-vous vraiment supprimer cette dépense ?")) return;

    axios.delete(`${API_BASE}/depenses/${id}`)
      .then(() => {
        setDepenses((prev) => prev.filter((d) => d.id !== id));
      })
      .catch((err) => {
        console.error(err);
        alert("Erreur lors de la suppression.");
      });
  };

  return (
    <Box sx={{ maxWidth: 680, margin: "40px auto", px: 2 }}>
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
        // AJOUT: mise en page en carte + couleurs sémantiques (rouge = dépenses, vert = revenus, orange = pour d'autres)
        <Paper variant="outlined" sx={{ p: 2, mb: 3, backgroundColor: "background.paper" }}>
          <Typography variant="h6" sx={{ color: "error.main", fontWeight: 700 }}>
            Total dépenses: {totauxMensuels[moisSelectionne].toFixed(2)} $
          </Typography>
          {totauxRevenusMensuels[moisSelectionne] !== undefined && (
            // AJOUT: affichage du total des revenus, en vert, à côté du total des dépenses
            <Typography variant="body1" sx={{ color: "success.main", fontWeight: 600 }}>
              Total revenus: {totauxRevenusMensuels[moisSelectionne].toFixed(2)} $
            </Typography>
          )}
          <Typography variant="body2" sx={{ color: "warning.main" }}>
            *Total pour quelqu'un d'autre: {totalPourAutresMensuel.toFixed(2)} $
          </Typography>
        </Paper>
      }

      <Grid container spacing={2}>
        {Object.entries(totauxParCategorie).map(([categorie, total]) => (
          <Grid key={categorie} size={{ xs: 6, sm: 4 }}>
            {/* AJOUT: bordure colorée selon le type de catégorie (revenu vs dépense) */}
            <Paper
              variant="outlined"
              sx={{
                borderColor: categorie === "Revenus" ? "success.main" : "error.main",
                borderWidth: 1.5,
                backgroundColor: "background.paper",
              }}
            >
              <Button onClick={handleClickOpen(categorie)} sx={{ width: "100%", p: 2, flexDirection: "column", color: "text.primary" }}>
                <Typography variant="subtitle2" color="text.secondary">
                  {categorie}
                </Typography>
                {/* AJOUT: couleur du montant selon revenu/dépense */}
                <Typography variant="h6" sx={{ color: categorie === "Revenus" ? "success.main" : "error.main" }}>
                  {total.toFixed(2)} $
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {quantiteDepensesParCategorie[categorie]} Item(s)
                </Typography>
                {totauxDepensesAutres[categorie] !== undefined && (
                  // AJOUT: Chip orange pour signaler visuellement la portion "pour quelqu'un d'autre"
                  <Chip
                    size="small"
                    label={`${totauxDepensesAutres[categorie].toFixed(2)} $ pour d'autres`}
                    sx={{ mt: 0.5, backgroundColor: "warning.main", color: "#000" }}
                  />
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
                  primary={
                    // AJOUT: petit Chip orange en ligne si la dépense est pour quelqu'un d'autre
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <span>{`${d.marchand ?? "Marchand inconnu"} — ${Number(d.montant).toFixed(2)} $`}</span>
                      {d.pourQuelquUnAutre && (
                        <Chip size="small" label="Pour un autre" sx={{ backgroundColor: "warning.main", color: "#000" }} />
                      )}
                    </Box>
                  }
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
          {message && (
            <Typography variant="body2" color="error.main">
              {message}
            </Typography>
          )}
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
              // AJOUT: la case cochée devient orange pour rester cohérent avec le code couleur "pour d'autres"
              sx={{ color: "warning.main", "&.Mui-checked": { color: "warning.main" } }}
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

//Consultation et utilisation de l'IA (Claude) pendant la phase de développement su projet.