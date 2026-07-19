/**
 * Uso: npm run admin:create -- --email=tu@correo.com --password=algoLargoYSeguro
 *
 * Crea (o actualiza) el usuario admin con la contraseña hasheada con bcrypt,
 * genera un secreto TOTP y muestra un QR en terminal (texto) + la URL
 * otpauth:// para escanear con Google Authenticator / Authy / 1Password.
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { authenticator } from "otplib";

const prisma = new PrismaClient();

function arg(name: string): string | undefined {
  const found = process.argv.find((a) => a.startsWith(`--${name}=`));
  return found?.split("=")[1];
}

async function main() {
  const email = arg("email");
  const password = arg("password");

  if (!email || !password) {
    console.error("Uso: npm run admin:create -- --email=tu@correo.com --password=xxxxxxxx");
    process.exit(1);
  }
  if (password.length < 12) {
    console.error("La contraseña debe tener al menos 12 caracteres.");
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const totpSecret = authenticator.generateSecret();
  const otpauthUrl = authenticator.keyuri(email, "Arcade Signal", totpSecret);

  const user = await prisma.adminUser.upsert({
    where: { email },
    update: { passwordHash, totpSecret, totpEnabled: true, failedLogins: 0, lockedUntil: null },
    create: { email, passwordHash, totpSecret, totpEnabled: true },
  });

  console.log(`\nUsuario admin listo: ${user.email}`);
  console.log(`\nEscanea esto en tu app de autenticación (Google Authenticator, etc):`);
  console.log(otpauthUrl);
  console.log(`\nO ingresa manualmente el secreto: ${totpSecret}`);
  console.log(`\nGuarda este secreto en un lugar seguro — no se volverá a mostrar.\n`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
