"use client"

import { useState, useEffect, useRef } from "react"
import { api, ApiError, type Document } from "@/lib/api"
import { Button } from "@founderiq/ui"
import { Upload, File, X, FileText, Download } from "lucide-react"

interface DocumentManagerProps {
  startupId: string
}

export function DocumentManager({ startupId }: DocumentManagerProps) {
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState("")
  const fileRef = useRef<HTMLInputElement>(null)

  const fetchDocuments = async () => {
    try {
      const data = await api.get<Document[]>(`/startups/${startupId}/documents`)
      setDocuments(data)
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDocuments()
  }, [startupId])

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setError("")
    try {
      const formData = new FormData()
      formData.append("file", file)
      await api.upload(`/startups/${startupId}/documents`, formData)
      await fetchDocuments()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Upload failed")
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ""
    }
  }

  const handleDelete = async (docId: string) => {
    try {
      await api.delete(`/startups/${startupId}/documents/${docId}`)
      setDocuments((prev) => prev.filter((d) => d.id !== docId))
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Delete failed")
    }
  }

  const fileIcon = (type: string) => {
    if (type.includes("pdf")) return "PDF"
    if (type.includes("image")) return "IMG"
    if (type.includes("video")) return "VID"
    if (type.includes("sheet") || type.includes("excel")) return "XLS"
    if (type.includes("presentation") || type.includes("powerpoint")) return "PPT"
    return "FILE"
  }

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <div
        onClick={() => fileRef.current?.click()}
        className="border-2 border-dashed border-foreground/10 rounded-lg p-12 text-center cursor-pointer hover:border-foreground/30 transition-colors"
      >
        <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-4" />
        <p className="text-sm font-medium mb-1">
          {uploading ? "Uploading..." : "Upload a document"}
        </p>
        <p className="text-xs text-muted-foreground font-mono">
          PDF, images, videos, spreadsheets, presentations (max 50MB)
        </p>
        <input
          ref={fileRef}
          type="file"
          onChange={handleUpload}
          className="hidden"
          accept=".pdf,.png,.jpg,.jpeg,.gif,.webp,.mp4,.webm,.ppt,.pptx,.xlsx,.txt,.csv"
        />
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-200">
          <p className="text-sm text-red-600 font-mono">{error}</p>
        </div>
      )}

      {/* Document List */}
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="w-5 h-5 rounded-full border-2 border-foreground/20 border-t-foreground animate-spin" />
        </div>
      ) : documents.length === 0 ? (
        <div className="border border-foreground/10 p-8 text-center">
          <p className="text-muted-foreground font-mono text-sm">No documents uploaded yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {documents.map((doc) => (
            <div key={doc.id} className="flex items-center justify-between bg-card border border-foreground/10 p-4">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-foreground/5 flex items-center justify-center">
                  <span className="text-[10px] font-mono text-muted-foreground">{fileIcon(doc.file_type)}</span>
                </div>
                <div>
                  <p className="text-sm font-medium">{doc.file_name || "Unnamed file"}</p>
                  <p className="text-xs text-muted-foreground font-mono">{doc.file_type}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {doc.file_url && (
                  <a
                    href={doc.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Download className="w-4 h-4" />
                  </a>
                )}
                <button
                  onClick={() => handleDelete(doc.id)}
                  className="p-2 text-muted-foreground hover:text-red-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
