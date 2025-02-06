import { type ReactNode } from 'react'
import { render } from '@react-email/render'
import Image from 'next/image'

interface BaseTemplateProps {
  children: ReactNode
  previewText?: string
}

function BaseTemplate({ children, previewText }: BaseTemplateProps) {
  // We need the html element for email templates
  // eslint-disable-next-line @next/next/no-head-element
  return (
    <html>
      {/* eslint-disable-next-line @next/next/no-head-element */}
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta httpEquiv="Content-Type" content="text/html; charset=UTF-8" />
        {previewText && <meta name="description" content={previewText} />}
        <title>GGWP.no</title>
      </head>
      <body
        style={{
          backgroundColor: '#f6f9fc',
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
          WebkitFontSmoothing: 'antialiased',
          fontSize: '14px',
          lineHeight: '1.4',
          margin: 0,
          padding: 0,
        }}
      >
        <table
          role="presentation"
          width="100%"
          style={{
            backgroundColor: '#f6f9fc',
            padding: '45px 0',
          }}
        >
          <tr>
            <td align="center">
              <table
                role="presentation"
                width="600"
                style={{
                  backgroundColor: '#ffffff',
                  borderRadius: '8px',
                  margin: '0 auto',
                  maxWidth: '600px',
                  padding: '45px',
                }}
              >
                <tr>
                  <td>
                    <div
                      style={{
                        textAlign: 'center',
                        marginBottom: '30px',
                      }}
                    >
                      <Image
                        src="/images/logo.png"
                        alt="GGWP.no"
                        width={150}
                        height={50}
                        style={{
                          height: 'auto',
                          marginBottom: '20px',
                        }}
                      />
                    </div>
                    {children}
                    <div
                      style={{
                        borderTop: '1px solid #e9ecef',
                        color: '#6c757d',
                        fontSize: '12px',
                        lineHeight: '1.5',
                        marginTop: '25px',
                        paddingTop: '25px',
                        textAlign: 'center',
                      }}
                    >
                      <p style={{ margin: '0 0 10px' }}>
                        © {new Date().getFullYear()} GGWP.no. Alle rettigheter
                        reservert.
                      </p>
                      <p style={{ margin: '0' }}>Sendt med ♥ fra Norge</p>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  )
}

interface WelcomeEmailProps {
  username: string
  verificationUrl?: string
}

export function WelcomeEmail({ username, verificationUrl }: WelcomeEmailProps) {
  return (
    <BaseTemplate previewText="Velkommen til GGWP.no - Din e-sport predictions plattform">
      <h1
        style={{
          color: '#1a1a1a',
          fontSize: '24px',
          fontWeight: '700',
          lineHeight: '1.2',
          margin: '0 0 15px',
        }}
      >
        Velkommen til GGWP.no, {username}!
      </h1>
      <p
        style={{
          color: '#4a5568',
          fontSize: '16px',
          lineHeight: '1.6',
          margin: '0 0 15px',
        }}
      >
        Vi er glade for å ha deg med i vårt fellesskap av e-sport-entusiaster.
        Gjør deg klar til å legge inn predictions og konkurrere med andre fans!
      </p>
      {verificationUrl && (
        <>
          <p
            style={{
              color: '#4a5568',
              fontSize: '16px',
              lineHeight: '1.6',
              margin: '0 0 24px',
            }}
          >
            For å komme i gang, vennligst bekreft e-postadressen din ved å
            klikke på knappen under:
          </p>
          <div style={{ textAlign: 'center', margin: '30px 0' }}>
            <a
              href={verificationUrl}
              style={{
                backgroundColor: '#0070f3',
                borderRadius: '5px',
                color: '#ffffff',
                display: 'inline-block',
                fontSize: '16px',
                fontWeight: '600',
                padding: '12px 24px',
                textDecoration: 'none',
                textAlign: 'center',
              }}
            >
              Bekreft E-postadresse
            </a>
          </div>
        </>
      )}
      <p
        style={{
          color: '#4a5568',
          fontSize: '16px',
          lineHeight: '1.6',
          margin: '0 0 15px',
        }}
      >
        Dette kan du gjøre på GGWP.no:
      </p>
      <ul
        style={{
          color: '#4a5568',
          fontSize: '16px',
          lineHeight: '1.6',
          margin: '0 0 15px',
          paddingLeft: '20px',
        }}
      >
        <li>Legg inn predictions på kommende e-sport-kamper</li>
        <li>Konkurrer med andre fans om poeng og ranking</li>
        <li>Følg med på din predictions-nøyaktighet</li>
        <li>Bli med i eller opprett predictions-ligaer med venner</li>
      </ul>
    </BaseTemplate>
  )
}

interface PickConfirmationEmailProps {
  username: string
  matchDetails: {
    team1: string
    team2: string
    predictedWinner: string
    tournament: string
    startTime: string
  }
}

export function PickConfirmationEmail({
  username,
  matchDetails,
}: PickConfirmationEmailProps) {
  return (
    <BaseTemplate previewText="Din prediction er bekreftet">
      <h1
        style={{
          color: '#1a1a1a',
          fontSize: '24px',
          fontWeight: '700',
          lineHeight: '1.2',
          margin: '0 0 15px',
        }}
      >
        Prediction Bekreftet!
      </h1>
      <p
        style={{
          color: '#4a5568',
          fontSize: '16px',
          lineHeight: '1.6',
          margin: '0 0 15px',
        }}
      >
        Hei {username}, din prediction er nå registrert.
      </p>
      <div
        style={{
          backgroundColor: '#f8fafc',
          borderRadius: '8px',
          margin: '24px 0',
          padding: '20px',
        }}
      >
        <h2
          style={{
            color: '#1a1a1a',
            fontSize: '18px',
            fontWeight: '600',
            margin: '0 0 12px',
          }}
        >
          Kamp-detaljer
        </h2>
        <p
          style={{
            color: '#4a5568',
            fontSize: '16px',
            lineHeight: '1.6',
            margin: '0 0 8px',
          }}
        >
          <strong>Turnering:</strong> {matchDetails.tournament}
        </p>
        <p
          style={{
            color: '#4a5568',
            fontSize: '16px',
            lineHeight: '1.6',
            margin: '0 0 8px',
          }}
        >
          <strong>Lag:</strong> {matchDetails.team1} vs {matchDetails.team2}
        </p>
        <p
          style={{
            color: '#4a5568',
            fontSize: '16px',
            lineHeight: '1.6',
            margin: '0 0 8px',
          }}
        >
          <strong>Ditt valg:</strong> {matchDetails.predictedWinner}
        </p>
        <p
          style={{
            color: '#4a5568',
            fontSize: '16px',
            lineHeight: '1.6',
            margin: '0',
          }}
        >
          <strong>Kampstart:</strong> {matchDetails.startTime}
        </p>
      </div>
      <div style={{ textAlign: 'center', margin: '30px 0' }}>
        <a
          href="https://ggwp.no"
          style={{
            backgroundColor: '#0070f3',
            borderRadius: '5px',
            color: '#ffffff',
            display: 'inline-block',
            fontSize: '16px',
            fontWeight: '600',
            padding: '12px 24px',
            textDecoration: 'none',
            textAlign: 'center',
          }}
        >
          Se Alle Predictions
        </a>
      </div>
    </BaseTemplate>
  )
}

// Helper function to render email templates to HTML
export async function renderEmail(template: JSX.Element): Promise<string> {
  return render(template)
}

// Example usage:
// const welcomeHtml = await renderEmail(
//   <WelcomeEmail
//     username="JohnDoe"
//     verificationUrl="https://ggwp.no/verify?token=xyz"
//   />
// )
