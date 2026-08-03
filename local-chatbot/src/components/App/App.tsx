import { BrowserRouter, Routes, Route } from "react-router-dom";
// AJOUT: ThemeProvider + CssBaseline pour appliquer le thème sombre
import { ThemeProvider, CssBaseline } from "@mui/material";
// AJOUT: import du thème créé
import { theme } from "../../themes/theme";
import Menu from "../Menu";
import Chat from "../Chat";
import Stats from "../Stats";
import Categories from "../Categories";

export default function App() {
  return (
    // AJOUT: ThemeProvider + CssBaseline enveloppent l'app existante, rien d'autre ne change
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Menu />}>
            <Route index element={<Chat />} />
            <Route path="stats" element={<Stats />} />
            <Route path="categories" element={<Categories />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}