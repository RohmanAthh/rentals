"use client"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

export default function DashboardChart({ data }: { data: { date: string, total: number }[] }) {
  if (data.length === 0) return <p className="text-gray-500 text-center py-12">Belum ada data transaksi.</p>

  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="date" />
          <YAxis tickFormatter={(value) => `Rp ${(value / 1000).toLocaleString()}K`} />
          <Tooltip 
            formatter={(value: unknown) => [`Rp ${Number(value).toLocaleString("id-ID")}`, "Total"]}
            labelFormatter={(label) => `Tanggal: ${label}`}
          />
          <Bar dataKey="total" fill="#4f46e5" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
