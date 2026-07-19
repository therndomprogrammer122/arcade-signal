/**
 * Seed de ejemplo — crea estaciones de muestra SIN tracks.
 * Agrega los tracks reales desde el panel /admin con el buscador de YouTube,
 * respetando los derechos de cada video que decidas usar.
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const stations = [
  {
    slug: "hyrule",
    name: "Estación Hyrule",
    franchise: "The Legend of Zelda",
    logoUrl: "/logos/hyrule.svg",
    accentColor: "#3E5C4A", // verde Hyrule apagado
    motif: "triforce", // anillos triangulares — aventura/fantasía
    featured: true,
    order: 1,
  },
  {
    slug: "big-shell",
    name: "Estación Big Shell",
    franchise: "Metal Gear Solid",
    logoUrl: "/logos/mgs.svg",
    accentColor: "#274B5E", // azul Big Shell profundo
    motif: "sonar", // pulso de radar — sigilo/táctico
    featured: true,
    order: 2,
  },
  {
    slug: "zebes",
    name: "Estación Zebes",
    franchise: "Metroid",
    logoUrl: "/logos/metroid.svg",
    accentColor: "#8C2F1B", // rojo Metroid quemado
    motif: "scanlines", // línea de escaneo HUD — sci-fi
    featured: false,
    order: 3,
  },
  {
    slug: "mushroom-kingdom",
    name: "Estación Reino Champiñón",
    franchise: "Super Mario",
    logoUrl: "/logos/mario.svg",
    accentColor: "#B23A2E",
    motif: "particles", // partículas ascendiendo — plataformas
    featured: false,
    order: 4,
  },
];

async function main() {
  for (const s of stations) {
    await prisma.station.upsert({ where: { slug: s.slug }, update: s, create: s });
  }
  console.log(`Seed listo: ${stations.length} estaciones de ejemplo.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
