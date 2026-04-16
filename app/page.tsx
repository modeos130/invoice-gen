import Link from 'next/link'
import { FileText, Download, Users, CheckCircle, Zap } from 'lucide-react'

export default function Home() {
  return (
    <div className="min-h-screen" style={{background: 'var(--bg)'}}>
      <header className="border-b" style={{borderColor: 'var(--border)', background: 'rgba(10,15,30,0.95)'}}>
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-6 h-6" style={{color: 'var(--accent)'}} />
            <span className="text-lg font-bold" style={{color: 'var(--text)'}}>I Hate Invoices</span>
            <span className="text-xs px-2 py-0.5 rounded-full ml-1" style={{background: 'rgba(37,99,235,0.15)', color: 'var(--accent2)', border: '1px solid rgba(37,99,235,0.3)'}}>by Booman Systems</span>
          </div>
          <Link href="/signup" className="text-sm font-semibold px-4 py-2 rounded-lg" style={{background: 'var(--accent)', color: '#fff'}}>Get Started Free</Link>
        </div>
      </header>

      <section className="max-w-4xl mx-auto px-6 py-24 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-mono mb-6" style={{background: 'rgba(37,99,235,0.1)', color: 'var(--accent2)', border: '1px solid rgba(37,99,235,0.2)'}}>
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          Professional invoicing — free to start
        </div>
        <h1 className="text-3xl sm:text-4xl md:text-6xl font-extrabold mb-6 leading-tight" style={{color: 'var(--text)'}}>
          I Hate Invoices<br /><span style={{color: 'var(--accent)'}}>So We Fixed It</span>
        </h1>
        <p className="text-xl mb-10 max-w-2xl mx-auto" style={{color: 'var(--text2)'}}>
          We get it. Here's the fix. Create, download, and send invoices without the headache.
        </p>
        <Link href="/signup" className="inline-flex items-center gap-2 px-8 py-3 rounded-lg font-semibold text-white" style={{background: 'var(--accent)'}}>
          <Zap className="w-4 h-4" /> Create Your First Invoice
        </Link>
      </section>

      <section className="max-w-6xl mx-auto px-6 py-16">
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { icon: Download, title: 'Instant PDF Download', desc: 'Generate pixel-perfect PDF invoices with your business info. Download and send in seconds.' },
            { icon: Users, title: 'Client Management', desc: 'Save client details and reuse them. Build your client list as you invoice.' },
            { icon: CheckCircle, title: 'Payment Tracking', desc: 'Mark invoices as Draft, Sent, or Paid. Always know what is outstanding.' },
          ].map((f, i) => (
            <div key={i} className="p-6 rounded-xl" style={{background: 'var(--bg2)', border: '1px solid var(--border)'}}>
              <f.icon className="w-8 h-8 mb-4" style={{color: 'var(--accent)'}} />
              <h3 className="text-lg font-bold mb-2" style={{color: 'var(--text)'}}>{f.title}</h3>
              <p className="text-sm" style={{color: 'var(--text3)'}}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-6 py-16 text-center">
        <h2 className="text-3xl font-extrabold mb-4" style={{color: 'var(--text)'}}>Simple pricing</h2>
        <p className="mb-10" style={{color: 'var(--text3)'}}>Start free. Upgrade when you need more.</p>
        <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
          {[
            { name: 'Free', price: '$0', features: ['3 invoices/month', 'PDF download', 'Basic template'], highlight: false },
            { name: 'Pro', price: '$7/mo', features: ['Unlimited invoices', 'Client management', 'Payment tracking', 'Custom notes & tax'], highlight: true },
          ].map((plan, i) => (
            <div key={i} className="p-6 rounded-xl text-left" style={{
              background: plan.highlight ? 'rgba(37,99,235,0.1)' : 'var(--bg2)',
              border: `1px solid ${plan.highlight ? 'rgba(37,99,235,0.5)' : 'var(--border)'}`,
            }}>
              <h3 className="font-bold text-lg mb-1" style={{color: 'var(--text)'}}>{plan.name}</h3>
              <div className="text-3xl font-extrabold mb-4" style={{color: plan.highlight ? 'var(--accent)' : 'var(--text)'}}>{plan.price}</div>
              <ul className="space-y-2 mb-6">
                {plan.features.map((f, j) => (
                  <li key={j} className="flex items-center gap-2 text-sm" style={{color: 'var(--text2)'}}>
                    <CheckCircle className="w-4 h-4 flex-shrink-0" style={{color: 'var(--success)'}} /> {f}
                  </li>
                ))}
              </ul>
              <Link href="/signup" className="block text-center py-2.5 rounded-lg font-semibold text-sm" style={{
                background: plan.highlight ? 'var(--accent)' : 'transparent',
                color: plan.highlight ? '#fff' : 'var(--text2)',
                border: plan.highlight ? 'none' : '1px solid var(--border)',
              }}>{plan.highlight ? 'Start Pro' : 'Start Free'}</Link>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t py-8 text-center" style={{borderColor: 'var(--border)'}}>
        <p className="text-sm" style={{color: 'var(--text3)'}}>2026 Booman Systems LLC — Built by DJ Booman</p>
        <p className="text-xs mt-1" style={{color: 'var(--text3)'}}>Part of the Booman Suite — ihateinvoices.com</p>
      </footer>
    </div>
  )
}
