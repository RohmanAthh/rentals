"use server"
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { v4 as uuidv4 } from "uuid"

const s3Client = new S3Client({
  region: process.env.AWS_REGION || "ap-southeast-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "mock-key",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "mock-secret",
  },
})

export async function getPresignedUrl(fileName: string, contentType: string, fileSize: number) {
  const session = await getServerSession(authOptions)
  
  if (session?.user?.role !== "ADMIN") {
    throw new Error("Unauthorized")
  }

  // Validate MIME type
  const allowedTypes = ["image/jpeg", "image/png", "image/webp"]
  if (!allowedTypes.includes(contentType)) {
    throw new Error("Tipe file tidak didukung. Harus image/jpeg, image/png, atau image/webp.")
  }

  // Validate size (max 5MB)
  if (fileSize > 5 * 1024 * 1024) {
    throw new Error("Ukuran file maksimal 5MB")
  }

  const key = `vehicles/${uuidv4()}-${fileName}`

  // If no real credentials, mock the URL for development testing
  if (process.env.AWS_ACCESS_KEY_ID === "mock-key" || !process.env.AWS_ACCESS_KEY_ID) {
    return { url: `https://mock-s3-url.com/${key}`, key }
  }

  const command = new PutObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET_NAME || "rentals-bucket",
    Key: key,
    ContentType: contentType,
  })

  const url = await getSignedUrl(s3Client, command, { expiresIn: 300 })
  return { url, key }
}
