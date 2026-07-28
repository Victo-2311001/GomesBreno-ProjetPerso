import { BrowserRouter, Routes, Route } from "react-router-dom";
import Menu from "../Menu";
import Chat from "../Chat";
import Depenses from "../Depenses";
import Stats from "../Stats";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Menu />}>
          <Route index element={<Chat />} />
          <Route path="depenses" element={<Depenses />} />
          <Route path="stats" element={<Stats />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}