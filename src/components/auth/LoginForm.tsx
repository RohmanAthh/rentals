"use client"
import { signIn } from "next-auth/react"
import { useState } from "react"
import { useRouter } from "next/navigation"

export default function LoginForm() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const email = formData.get("email") as string
    const password = formData.get("password") as string
    
    const res = await signIn("credentials", {
      email,
      password,
      redirect: false
    })
    
    if (res?.error) {
      setError("Email atau password salah")
    } else {
      router.push("/")
      router.refresh()
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full max-w-sm">
      {error && <div className="text-red-500 bg-red-100 p-2 rounded">{error}</div>}
      <div>
        <label htmlFor="email">Email</label>
        <input id="email" name="email" type="email" required className="w-full border p-2 rounded" />
      </div>
      <div>
        <label htmlFor="password">Password</label>
        <input id="password" name="password" type="password" required className="w-full border p-2 rounded" />
      </div>
      <button type="submit" className="bg-blue-600 text-white p-2 rounded">
        Login
      </button>
    </form>
  )
}
