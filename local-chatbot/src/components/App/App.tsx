import { BrowserRouter, Routes, Route } from "react-router-dom";
import Menu from "../Menu";
import Chat from "../Chat";
import Stats from "../Stats";
import Categories from "../Categories";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Menu />}>
          <Route index element={<Chat />} />
          <Route path="stats" element={<Stats />} />
          <Route path="categories" element={<Categories />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}