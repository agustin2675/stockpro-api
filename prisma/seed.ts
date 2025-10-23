import { PrismaClient, Rol } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // Datos del usuario admin por defecto
  const adminEmail = 'admin@estrellastockpro.com';
  const adminPassword = 'admin123'; // 🔒 cámbialo después de correr el seed

  // Hasheamos la contraseña
  const hashedPassword = await bcrypt.hash(adminPassword, 10);
const sucursal = await prisma.sucursal.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1,
        nombre: 'Confiteria',
        activo:true,
        direccion:"",
        telefono:""
    } // completa los campos reales
  })


  // Verificamos si ya existe un admin
  const existingAdmin = await prisma.usuario.findFirst({
    where: { nombre: adminEmail },
  });

  if (!existingAdmin) {
    await prisma.usuario.create({
      data: {
        nombre: adminEmail,
        telefono: '3810000000',
        rol: Rol.ADMIN, // asegúrate que coincida con tu enum en el schema
        password: hashedPassword,
        activo: true,
        sucursal: { connect: { id: sucursal.id } },
      },
    });
    console.log('✅ Usuario admin creado correctamente.');
  } else {
    console.log('ℹ️ El usuario admin ya existe, no se creó uno nuevo.');
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
