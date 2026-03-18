"use client";

import { useState } from "react";
import Nav from "@/components/Nav";
import Hero from "@/components/Hero";
import About from "@/components/About";
import Locations from "@/components/Locations";
import ReserveCTA from "@/components/ReserveCTA";
import Press from "@/components/Press";
import Footer from "@/components/Footer";
import ChatWidget from "@/components/ChatWidget";

export default function Home() {
  const [chatOpen, setChatOpen] = useState(false);

  return (
    <>
      <Nav onReserveClick={() => setChatOpen(true)} />
      <main>
        <Hero onReserveClick={() => setChatOpen(true)} />
        <About />
        <Locations onReserveClick={() => setChatOpen(true)} />
        <ReserveCTA onReserveClick={() => setChatOpen(true)} />
        <Press />
      </main>
      <Footer />
      <ChatWidget
        isOpen={chatOpen}
        onOpen={() => setChatOpen(true)}
        onClose={() => setChatOpen(false)}
      />
    </>
  );
}
