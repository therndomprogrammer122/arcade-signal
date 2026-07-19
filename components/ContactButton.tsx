"use client";

// El email se arma en tiempo de ejecución, en el navegador, para que no
// aparezca como texto plano en el HTML servido — reduce el scraping por
// bots de spam sin cambiar la dirección real ni esconderla de una persona.
const USER = "contacto";
const DOMAIN = "akechigoro988@gmail.com";

export default function ContactButton() {
  const email = `${USER}@${DOMAIN}`;

  function handleClick() {
    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(email)}`;
    window.open(gmailUrl, "_blank", "noopener,noreferrer");
  }

  return (
    <button
      onClick={handleClick}
      className="font-serif text-2xl text-ink underline underline-offset-4 decoration-ink/30 hover:decoration-led hover:text-led transition-colors duration-instant ease-enter"
    >
      Escribir un correo →
    </button>
  );
}