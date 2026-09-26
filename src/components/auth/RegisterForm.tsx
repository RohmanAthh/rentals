"use client"
import { useState } from "react"

import { signIn } from "next-auth/react"

export default function RegisterForm() {
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const data = Object.fromEntries(formData.entries())
    
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    })
    
    if (!res.ok) {
      const errData = await res.json()
      setError(errData.message || "Gagal registrasi")
      return
    }

    // Auto login
    await signIn("credentials", {
      email: data.email,
      password: data.password,
      callbackUrl: "/"
    })
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full max-w-sm">
      {error && <div className="text-red-500 bg-red-100 p-2 rounded">{error}</div>}
      <div>
        <label>Nama Lengkap</label>
        <input name="name" type="text" required className="w-full border p-2 rounded" />
      </div>
      <div>
        <label>Email</label>
        <input name="email" type="email" required className="w-full border p-2 rounded" />
      </div>
      <div>
        <label>No. HP</label>
        <input name="phone" type="text" required className="w-full border p-2 rounded" />
      </div>
      <div>
        <label>Password</label>
        <input name="password" type="password" required className="w-full border p-2 rounded" />
      </div>
      <button type="submit" className="bg-green-600 text-white p-2 rounded">
        Daftar
      </button>
    </form>
  )
}
