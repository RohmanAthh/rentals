import RegisterForm from "@/components/auth/RegisterForm"

export default function RegisterPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-2xl font-bold mb-8">Pendaftaran Akun Baru</h1>
      <RegisterForm />
    </main>
  )
}
