import { Link } from "react-router-dom";
import Layout from "@/components/Layout";
import { Shield, DollarSign, MapPin } from "lucide-react";

export default function Home() {
  return (
    <Layout>
      <section className="container py-14">
        <div className="text-center max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold text-accent leading-tight mb-4">
            Bienvenue sur RideSharing
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto mb-8">
            Une plateforme de covoiturage dédiée aux étudiants et au personnel de l'Université
            Saint‑Joseph — Beyrouth. Partagez des trajets, réduisez vos frais, et contribuez à un campus
            plus durable et solidaire.
          </p>
        </div>

        <p className="text-center text-muted-foreground font-medium mb-6">
          Avec ces deux options, trouvez rapidement votre prochain trajet ou publiez le vôtre en quelques clics.
        </p>

        <div className="flex flex-col sm:flex-row gap-5 justify-center mb-16">
          <Link
            to="/find-ride"
            className="flex items-center justify-center min-h-[90px] px-8 rounded-2xl font-extrabold text-lg text-primary-foreground bg-gradient-to-b from-primary to-accent shadow-lg hover:-translate-y-0.5 hover:shadow-xl transition-all no-underline sm:w-[380px]"
          >
            Trouver un trajet
          </Link>
          <Link
            to="/create-ride"
            className="flex items-center justify-center min-h-[90px] px-8 rounded-2xl font-extrabold text-lg text-primary-foreground bg-gradient-to-b from-primary to-accent shadow-lg hover:-translate-y-0.5 hover:shadow-xl transition-all no-underline sm:w-[380px]"
          >
            Créer un trajet
          </Link>
        </div>

        <section>
          <h2 className="text-3xl font-bold text-accent mb-6">Pourquoi RideSharing ?</h2>
          <div className="grid md:grid-cols-3 gap-5">
            {[
              {
                icon: Shield,
                title: "Sécurité & Confiance",
                desc: "Profils et évaluations pour favoriser des trajets sereins entre membres de la communauté USJ.",
              },
              {
                icon: DollarSign,
                title: "Partage transparent",
                desc: "Propositions de contribution et calcul automatique pour répartir équitablement les frais.",
              },
              {
                icon: MapPin,
                title: "Respect du campus",
                desc: "Points de prise en charge officiels pour ne pas encombrer les accès et garantir la sécurité.",
              },
            ].map((f) => (
              <article
                key={f.title}
                className="bg-card/90 border border-border rounded-xl p-5 shadow-md hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lg transition-all"
              >
                <f.icon className="h-8 w-8 text-primary mb-3" />
                <h3 className="font-bold text-accent mb-2">{f.title}</h3>
                <p className="text-muted-foreground text-sm">{f.desc}</p>
              </article>
            ))}
          </div>
        </section>
      </section>
    </Layout>
  );
}
