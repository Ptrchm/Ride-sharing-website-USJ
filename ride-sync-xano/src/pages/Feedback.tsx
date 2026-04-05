import { useState } from "react";
import Layout from "@/components/Layout";
import { createFeedback } from "@/lib/api";
import { toast } from "@/hooks/use-toast";

export default function Feedback() {
  const [form, setForm] = useState({ name: "", email: "", type: "Suggestion", message: "" });
  const [loading, setLoading] = useState(false);

  const set = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.message.trim()) {
      toast({ title: "Veuillez écrire un message.", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      await createFeedback(form);
      toast({ title: "Merci !", description: "Votre retour a été envoyé." });
      setForm({ name: "", email: "", type: "Suggestion", message: "" });
    } catch (err: any) {
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <section className="container py-10">
        <div className="max-w-3xl mx-auto bg-card/90 border border-border rounded-2xl shadow-lg overflow-hidden">
          <div className="p-6 border-b border-border">
            <h1 className="text-2xl font-bold text-accent mb-2">Votre retour nous aide à améliorer RideSharing</h1>
            <p className="text-muted-foreground">Partagez votre expérience, vos suggestions ou les points à améliorer.</p>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <label className="font-semibold text-sm text-foreground">Nom (optionnel)</label>
                <input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Ex: Joseph Azar" maxLength={80} className="px-3 py-3 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary" />
              </div>
              <div className="flex flex-col gap-2">
                <label className="font-semibold text-sm text-foreground">Email USJ (optionnel)</label>
                <input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="prenom.nom@usj.edu.lb" maxLength={120} className="px-3 py-3 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary" />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="font-semibold text-sm text-foreground">Type de retour</label>
              <select value={form.type} onChange={(e) => set("type", e.target.value)} className="px-3 py-3 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary">
                <option>Suggestion</option>
                <option>Problème</option>
                <option>Expérience</option>
                <option>Autre</option>
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <label className="font-semibold text-sm text-foreground">Votre message</label>
              <textarea value={form.message} onChange={(e) => set("message", e.target.value)} rows={6} required placeholder="Dites-nous ce que vous pensez de la plateforme..." className="px-3 py-3 rounded-xl border border-border bg-background text-foreground text-sm resize-y min-h-[150px] focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary" />
            </div>

            <div className="flex flex-wrap gap-3 pt-2">
              <button type="submit" disabled={loading} className="min-w-[190px] py-3 rounded-xl bg-gradient-to-b from-primary to-accent text-primary-foreground font-bold hover:opacity-90 transition-opacity disabled:opacity-50">
                {loading ? "Envoi..." : "Envoyer le feedback"}
              </button>
              <a href="/" className="min-w-[190px] py-3 rounded-xl border border-border bg-card text-accent font-bold text-center no-underline hover:bg-muted transition-colors">
                Retour à l'accueil
              </a>
            </div>
          </form>
        </div>
      </section>
    </Layout>
  );
}
