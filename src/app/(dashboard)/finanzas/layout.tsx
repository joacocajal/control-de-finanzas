import { WalletProvider } from '@/contexts/WalletContext'

export default function FinanzasLayout({ children }: { children: React.ReactNode }) {
  return <WalletProvider>{children}</WalletProvider>
}
