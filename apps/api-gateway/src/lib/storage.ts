import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3"

const client = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID ?? "",
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY ?? "",
  },
})

const BUCKET = process.env.R2_BUCKET_NAME ?? "founderiq-uploads"
const PUBLIC_URL = process.env.R2_PUBLIC_URL ?? ""

export async function uploadFile(
  key: string,
  buffer: Buffer,
  contentType: string,
): Promise<string> {
  await client.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    }),
  )
  return PUBLIC_URL ? `${PUBLIC_URL}/${key}` : key
}

export async function deleteFile(key: string): Promise<void> {
  await client.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }))
}

export function generateKey(startupId: string, fileName: string): string {
  const ext = fileName.split(".").pop() ?? "bin"
  return `startups/${startupId}/${Date.now()}-${crypto.randomUUID()}.${ext}`
}

export const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
  "video/mp4",
  "video/webm",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/plain",
  "text/csv",
] as const

export type AllowedMimeType = (typeof ALLOWED_MIME_TYPES)[number]

export function isAllowedMimeType(mime: string): mime is AllowedMimeType {
  if (mime.startsWith("image/")) return true
  return ALLOWED_MIME_TYPES.includes(mime as AllowedMimeType)
}

const MAX_FILE_SIZE = 50 * 1024 * 1024

export function isWithinSizeLimit(size: number): boolean {
  return size <= MAX_FILE_SIZE
}
