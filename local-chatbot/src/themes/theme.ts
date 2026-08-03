// AJOUT: thème sombre personnalisé avec des couleurs sémantiques
// pour distinguer revenus / dépenses / dépenses pour quelqu'un d'autre
import { createTheme } from "@mui/material/styles";

export const theme = createTheme({
  palette: {
    mode: "dark",
    primary: {
      main: "#7c9eff",
    },
    background: {
      default: "#121212",
      paper: "#1e1e1e",
    },
    // AJOUT: couleurs personnalisées accessibles via theme.palette.revenu / .depense / .pourAutre
    success: {
      main: "#4caf50", // revenus
    },
    error: {
      main: "#ef5350", // dépenses normales
    },
    warning: {
      main: "#ffa726", // dépenses pour quelqu'un d'autre
    },
  },
  shape: {
    borderRadius: 10,
  },
});