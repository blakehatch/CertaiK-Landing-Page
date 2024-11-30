import { SpinningCoin } from "@/components/spinning-coin"
import { Roadmap } from "@/components/roadmap"
import Image from "next/image"

export default function Home() {
  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white overflow-hidden">
      {/* Background Image */}
      <div className="fixed inset-0 z-0">
        <div className="relative w-full h-full">
          <Image
            src="/cyberpunk-city.jpg"
            alt="Cyberpunk City"
            layout="fill"
            objectFit="cover"
            quality={100}
            className="brightness-50"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/30 via-purple-500/20 to-[#0a0a0a]/70" />
      </div>

      {/* Content */}
      <div className="relative z-10">
        {/* Hero Section */}
        <section className="relative h-screen flex flex-col items-center justify-center">
          <h1 className="text-6xl md:text-8xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-600 text-center mb-2 drop-shadow-lg">
            CertaiK
          </h1>
          <p className="text-sm md:text-base font-medium text-cyan-400 text-center mb-8">
            An AI Agent Powered by Virtuals Protocol
          </p>
          <SpinningCoin />
          <p className="text-xl md:text-2xl text-cyan-400 mt-8 text-center max-w-2xl mx-auto px-4 drop-shadow-lg">
            The Future of Smart Contract Auditors
          </p>
        </section>

        {/* Bio Section */}
        <section className="py-20 px-4 relative">
          <div className="absolute inset-0 bg-[#0a0a0a]/70 backdrop-blur-sm" />
          <div className="max-w-4xl mx-auto relative">
            <h2 className="text-4xl font-bold text-center mb-8 text-cyan-400">
              Revolutionizing Smart Contract Audits
            </h2>
            <div className="space-y-6 text-lg text-gray-300">
              <p>
                CertaiK is pioneering the future of blockchain security through advanced AI agent-powered smart contract auditing. 
                Our mission is to democratize access to professional-grade security audits, making them available to all projects 
                regardless of size or budget.
              </p>
              <p>
                With $1.8 billion lost to smart contract exploits annually, the need for robust security solutions has never 
                been more critical. CertaiK leverages cutting-edge artificial intelligence to provide continuous, automated 
                auditing that adapts to new threats in real-time.
              </p>
              <p>
                By making smart contract security accessible and affordable, we&apos;re working to bring exploit losses to zero 
                and create a safer blockchain ecosystem for everyone.
              </p>
              <p>
                We are committed to ending the traditional reign of tyranny by outdated security models like Certik&apos;s. 
                Our equitable AI-driven approach ensures that power is distributed fairly, providing all blockchain projects 
                with the tools they need to secure their future. By replacing old paradigms with innovative solutions, 
                CertaiK is leading the charge towards a more just and secure digital world.
              </p>
            </div>
          </div>
        </section>

        {/* Roadmap Section */}
        <Roadmap />

        {/* Footer */}
        <footer className="border-t border-cyan-900/30 py-8">
          <div className="max-w-4xl mx-auto px-4 text-center text-white-500">
            <p>© 2024 CertaiK. Securing the future of blockchain.</p>
          </div>
        </footer>
      </div>
    </main>
  )
}
