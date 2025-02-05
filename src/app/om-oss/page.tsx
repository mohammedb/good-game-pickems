'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6 } }
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
}

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
}

export default function AboutUs() {
  return (
    <main className="min-h-screen py-20">
      <div className="container mx-auto px-4">
        {/* Hero Section */}
        <motion.div
          initial="hidden"
          animate="show"
          variants={container}
          className="text-center mb-16"
        >
          <motion.h1 
            variants={item}
            className="text-4xl font-bold mb-6 sm:text-5xl"
          >
            Om{' '}
            <span className="bg-gradient-to-r from-primary to-primary/50 bg-clip-text text-transparent">
              GGWP.NO
            </span>
          </motion.h1>
          <motion.p 
            variants={item}
            className="text-lg text-muted-foreground max-w-2xl mx-auto"
          >
            Jeg er lidenskapelig opptatt av norsk e-sport og ønsker å skape engasjement 
            rundt de aktive ligaene i Norge. La oss sammen bygge et sterkere e-sport-miljø.
          </motion.p>
        </motion.div>

        {/* Team Section */}
        <motion.section
          initial="hidden"
          animate="show"
          variants={container}
          className="mb-20 max-w-lg mx-auto"
        >
          <motion.h2 
            variants={item}
            className="text-3xl font-bold text-center mb-12"
          >
            Om Meg
          </motion.h2>

          <motion.div variants={item}>
            <Card className="p-6 text-center hover:shadow-lg transition-shadow">
              <div className="relative w-48 h-48 mx-auto mb-6 rounded-full overflow-hidden">
                <Image
                  src="/images/mohammed.jpeg"
                  alt="KekMek"
                  fill
                  className="object-cover"
                />
              </div>
              <h3 className="text-xl font-semibold mb-2">KekMek</h3>
              <p className="text-muted-foreground mb-4">Grunnlegger & Utvikler</p>
              <p className="text-sm text-muted-foreground">
                Lidenskapelig e-sport-entusiast med over 10 års erfaring i spillbransjen.
              </p>
            </Card>
          </motion.div>
        </motion.section>

        {/* Mission Section */}
        <motion.section
          initial="hidden"
          animate="show"
          variants={container}
          className="max-w-4xl mx-auto space-y-12"
        >
          <motion.h2 
            variants={item}
            className="text-3xl font-bold text-center mb-12"
          >
            Min Misjon
          </motion.h2>

          <motion.div 
            variants={item}
            className="grid gap-8 md:grid-cols-2"
          >
            <Card className="p-6">
              <h3 className="text-xl font-semibold mb-4">Min Visjon</h3>
              <p className="text-muted-foreground">
                Å være en drivkraft for vekst i norsk e-sport ved å skape engasjement rundt 
                ligaene og støtte opp om det lokale konkurransemiljøet.
              </p>
            </Card>

            <Card className="p-6">
              <h3 className="text-xl font-semibold mb-4">Mine Verdier</h3>
              <p className="text-muted-foreground">
                Jeg tror på å fremheve norsk e-sport, støtte lokale talenter, og bygge et 
                inkluderende fellesskap som bidrar til vekst i det norske e-sport-miljøet.
              </p>
            </Card>
          </motion.div>

          <motion.div
            variants={item}
            className="mt-12"
          >
            <Card className="p-8 text-center">
              <h3 className="text-2xl font-semibold mb-4">Vil du bidra?</h3>
              <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                Er du interessert i å være med på å forme fremtiden til norsk e-sport? 
                Jeg er alltid på utkikk etter engasjerte mennesker som ønsker å bidra til vekst 
                i det norske e-sport-miljøet.
              </p>
              <Link href="mailto:mohammedbarzinje@gmail.com">
                <Button className="gap-2">
                  Ta Kontakt <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </Card>
          </motion.div>
        </motion.section>
      </div>
    </main>
  )
} 