import { Outlet, Link } from "react-router-dom";
import { AppBar, Toolbar, Button, Box, Typography } from "@mui/material";

export default function Menu() {
  return (
    <Box>
      <AppBar position="static">
        <Toolbar>
          <Button color="inherit" component={Link} to="/">
              <Typography variant="h6">
                Radin AI 
              </Typography> 
          </Button>        
          <Button color="inherit" component={Link} to="/">
            Chat
          </Button>
          <Button color="inherit" component={Link} to="/depenses">
            Dépenses
          </Button>
          <Button color="inherit" component={Link} to="/stats">
            Statistiques
          </Button>
        </Toolbar>
      </AppBar>
      <Outlet />
    </Box>
  );
}