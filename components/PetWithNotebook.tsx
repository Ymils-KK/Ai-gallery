"use client";

import { useState } from "react";
import Pet from "./Pet";
import Notebook from "./Notebook";

export default function PetWithNotebook() {
  const [notebookOpen, setNotebookOpen] = useState(false);

  return (
    <>
      <Pet onNotebookToggle={() => setNotebookOpen((v) => !v)} />
      <Notebook open={notebookOpen} onClose={() => setNotebookOpen(false)} />
    </>
  );
}
