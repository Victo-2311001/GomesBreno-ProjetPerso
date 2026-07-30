import { useEffect, useState } from "react";
import { Box, Typography, TextField, Paper, Grid } from "@mui/material";
import axios from "axios";

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

  //Récupérer les dépenses 
  useEffect(() => {
    axios.get<Depense[]>(`${API_BASE}/depenses`)
      .then(({ data }) => {setDepenses(data);
    });
  }, []);

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
      
      {totauxMensuels[moisSelectionne] &&
        <Typography variant="h6" gutterBottom>
          Total: {totauxMensuels[moisSelectionne]?.toFixed(2) ?? "0.00"} $
        </Typography>
      }

      <Grid container spacing={2}>
        {Object.entries(totauxParCategorie).map(([categorie, total]) => (
          <Grid key={categorie} size={{ xs: 6, sm: 4 }}>
            <Paper variant="outlined" sx={{ p: 2, textAlign: "center" }}>
              <Typography variant="subtitle2" color="text.secondary">
                {categorie}
              </Typography>
              <Typography variant="h6">{total.toFixed(2)} $</Typography>
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
    </Box>
  );
}