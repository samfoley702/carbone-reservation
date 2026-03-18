"use client";

import { useEffect } from "react";
import FormEngine from "./FormEngine";

interface ReservationFormProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ReservationForm({ isOpen, onClose }: ReservationFormProps) {
  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  return (
    <div className={`form-overlay${isOpen ? " form-overlay--active" : ""}`}>
      {isOpen && <FormEngine onClose={onClose} />}
    </div>
  );
}
