import LoginForm from "@/components/auth/LoginForm"

export default function LoginPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-2xl font-bold mb-8">Masuk ke Akun</h1>
      <LoginForm />
    </main>
  )
}
