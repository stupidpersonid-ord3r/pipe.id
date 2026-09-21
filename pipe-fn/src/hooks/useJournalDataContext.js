import { useContext } from "react";
import { JournalDataContext } from "../context/JournalDataContext";

export function useJournalData() {
  const context = useContext(JournalDataContext);
  if (!context) throw new Error("useJournalData must be used inside JournalDataProvider");
  return context;
}
