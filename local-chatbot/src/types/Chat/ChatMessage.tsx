import DepenseExtraite from "../Depense/DepenseExtraite";

type ChatMessage = {
  role: "Toi" | "Radin";
  content: string;
  image?: string | null;
  depenses?: DepenseExtraite[] | null;  
  enregistre?: boolean;
};

export default ChatMessage;