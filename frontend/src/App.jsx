import { Routes, Route } from "react-router-dom";
import Login from "./pages/login.jsx";
import Home from "./pages/Home.jsx";
import FileSheets from "./pages/FileSheets.jsx";
import SheetDetail from "./pages/SheetDetail.jsx";
import CreateFile from "./pages/CreateFile.jsx";
import Users from "./pages/Users.jsx";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/accueil" element={<Home />} />
      <Route path="/nouveau-fichier" element={<CreateFile />} />
      <Route path="/fichier/:filename" element={<FileSheets />} />
      <Route path="/fichier/:filename/feuille/:sheetName" element={<SheetDetail />} />
      <Route path="/utilisateurs" element={<Users />} />
    </Routes>
  );
}
