"use client";

import { useState } from "react";
import Nav from "@/components/Nav";
import Hero from "@/components/Hero";
import About from "@/components/About";
import Locations from "@/components/Locations";
import ReserveCTA from "@/components/ReserveCTA";
import Press from "@/components/Press";
import Footer from "@/components/Footer";
import ReservationForm from "@/components/ReservationForm";

export default function Home() {
  const [formOpen, setFormOpen] = useState(false);

  return (
    <>
      <Nav onReserveClick={() => setFormOpen(true)} />
      <main>
        <Hero onReserveClick={() => setFormOpen(true)} />
        <About />
        <Locations onReserveClick={() => setFormOpen(true)} />
        <ReserveCTA onReserveClick={() => setFormOpen(true)} />
        <Press />
      </main>
      <Footer />
      <ReservationForm isOpen={formOpen} onClose={() => setFormOpen(false)} />
    </>
  );
}
