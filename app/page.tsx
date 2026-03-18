"use client";

import Nav from "@/components/Nav";
import Hero from "@/components/Hero";
import About from "@/components/About";
import Locations from "@/components/Locations";
import ReserveCTA from "@/components/ReserveCTA";
import Press from "@/components/Press";
import Footer from "@/components/Footer";
import ChatWidget from "@/components/ChatWidget";

export default function Home() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <About />
        <Locations />
        <ReserveCTA />
        <Press />
      </main>
      <Footer />
      <ChatWidget />
    </>
  );
}
