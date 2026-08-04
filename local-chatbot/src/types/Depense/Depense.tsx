type Depense = {
  id: number;
  montant: number;
  categorie: string;
  date: string;
  marchand: string | null;
  description: string | null;
  pourQuelquUnAutre: boolean;
};

export default Depense;