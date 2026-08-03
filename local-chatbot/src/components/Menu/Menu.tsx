import { Outlet, Link } from "react-router-dom";
import { AppBar, Toolbar, Button, Box, Typography } from "@mui/material";

export default function Menu() {
  return (
    <Box>
      {/* AJOUT: sx pour un style plus distinctif que l'AppBar par défaut */}
      <AppBar position="static" sx={{ backgroundColor: "#1a1a2e" }}>
        <Toolbar>
          <Button color="inherit" component={Link} to="/">
              <Typography variant="h6" sx={{ fontWeight: 700, letterSpacing: 0.5 }}>
                Radin AI 
              </Typography> 
          </Button>        
          <Button color="inherit" component={Link} to="/">
            Chat
          </Button>
          <Button color="inherit" component={Link} to="/categories">
            Catégories
          </Button>
          <Button color="inherit" component={Link} to="/stats">
            Statistiques
          </Button>
        </Toolbar>
      </AppBar>
      {/* AJOUT: sx sur le Box englobant le contenu des pages, pour un fond cohérent avec le thème sombre */}
      <Box sx={{ minHeight: "100vh", backgroundColor: "background.default" }}>
        <Outlet />
      </Box>
    </Box>
  );
}