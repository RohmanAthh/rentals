import { PrismaClient } from '@prisma/client'
import * as bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  // Seed initial Admin User
  const adminPassword = await bcrypt.hash('AdminP@ssw0rd123', 10)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@rental-mobil.com' },
    update: {},
    create: {
      email: 'admin@rental-mobil.com',
      name: 'Super Admin',
      phone: '081234567890',
      password: adminPassword,
      role: 'ADMIN',
    },
  })
  console.log({ admin })

  // Seed Categories
  const categories = ['SUV', 'Sedan', 'Hatchback', 'Minivan', 'Luxury']
  for (const name of categories) {
    await prisma.vehicleCategory.upsert({
      where: { name },
      update: {},
      create: { name, description: `Kategori mobil ${name}` },
    })
  }
  console.log('Categories seeded')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
