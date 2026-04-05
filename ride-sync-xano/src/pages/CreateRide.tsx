import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { createRoute, getDriverDetails, createDriverApplication, verifyDriver } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { MapPin, Clock, Car, DollarSign, FileText, ShieldCheck, IdCard, Phone, Camera } from "lucide-react";


function DriverRegistrationForm({ user, onRegistered }: { user: any; onRegistered: () => void }) {
  const [form, setForm] = useState({
    car_model: "",
    car_plate_number: "",
    license_number: "",
    phone_number: "",
    email: user?.email || "",
  });
  const [licensePhoto, setLicensePhoto] = useState<File | null>(null);
  const [carRegPhoto, setCarRegPhoto] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user?.email) {
      setForm((p) => ({ ...p, email: user.email }));
    }
  }, [user?.email]);

  const set = (key: string, val: string) => setForm((p) => ({ ...p, [key]: val }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.car_model || !form.car_plate_number || !form.license_number || !form.phone_number) {
      toast({ title: "Tous les champs obligatoires sont requis", variant: "destructive" });
      return;
    }
    if (!licensePhoto || !carRegPhoto) {
      toast({ title: "Veuillez télécharger les photos du permis et de la carte grise", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      await createDriverApplication({
        user_id: user?.id || 0,
        email: user?.email || form.email,
        car_model: form.car_model,
        car_plate_number: form.car_plate_number,
        license_number: form.license_number,
        phone_number: form.phone_number,
        license_photo: licensePhoto,
        car_registration_photo: carRegPhoto,
      });
      toast({ title: "Inscription conducteur réussie !", description: "Vos documents seront vérifiés par l'équipe." });
      onRegistered();
    } catch (err: any) {
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto">
      <div className="bg-card border border-border rounded-xl p-6 mb-6 shadow-sm text-center">
        <ShieldCheck size={48} className="mx-auto text-primary mb-4" />
        <h2 className="text-xl font-bold text-foreground mb-2">Devenir conducteur</h2>
        <p className="text-muted-foreground text-sm mb-6">
          Pour créer un trajet, vous devez d'abord vous inscrire en tant que conducteur en fournissant les informations de votre véhicule, permis et documents justificatifs.
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Vehicle */}
        <div className="bg-card border border-border rounded-xl p-6 mb-5 shadow-sm">
          <h3 className="flex items-center gap-2 font-bold text-foreground mb-4"><Car size={18} /> Véhicule</h3>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-semibold text-foreground block mb-2">Modèle du véhicule <span className="text-destructive">*</span></label>
              <input value={form.car_model} onChange={(e) => set("car_model", e.target.value)} placeholder="ex. Toyota Corolla 2020" required className="w-full px-3 py-3 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary" />
            </div>
            <div>
              <label className="text-sm font-semibold text-foreground block mb-2">Numéro de plaque <span className="text-destructive">*</span></label>
              <input value={form.car_plate_number} onChange={(e) => set("car_plate_number", e.target.value)} placeholder="ex. B 123456" required className="w-full px-3 py-3 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary" />
            </div>
          </div>
        </div>

        {/* License */}
        <div className="bg-card border border-border rounded-xl p-6 mb-5 shadow-sm">
          <h3 className="flex items-center gap-2 font-bold text-foreground mb-4"><IdCard size={18} /> Permis de conduire</h3>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-semibold text-foreground block mb-2">Numéro de permis <span className="text-destructive">*</span></label>
              <input value={form.license_number} onChange={(e) => set("license_number", e.target.value)} placeholder="ex. 12345678" required className="w-full px-3 py-3 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary" />
            </div>
          </div>
        </div>

        {/* Phone */}
        <div className="bg-card border border-border rounded-xl p-6 mb-5 shadow-sm">
          <h3 className="flex items-center gap-2 font-bold text-foreground mb-4"><Phone size={18} /> Contact</h3>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-semibold text-foreground block mb-2">Adresse e-mail <span className="text-destructive">*</span></label>
              <input value={form.email} readOnly type="email" required className="w-full px-3 py-3 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary opacity-80" />
            </div>
            <div>
              <label className="text-sm font-semibold text-foreground block mb-2">Numéro de téléphone <span className="text-destructive">*</span></label>
              <input value={form.phone_number} onChange={(e) => set("phone_number", e.target.value)} placeholder="ex. +961 71 123 456" required className="w-full px-3 py-3 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary" />
              <p className="text-xs text-muted-foreground mt-2 bg-muted/50 border border-border rounded-md px-3 py-2">🔒 Votre numéro ne sera visible que par les passagers dont vous avez accepté la demande. Il n'apparaîtra pas dans les résultats de recherche.</p>
            </div>
          </div>
        </div>

        {/* Document uploads */}
        <div className="bg-card border border-border rounded-xl p-6 mb-5 shadow-sm">
          <h3 className="flex items-center gap-2 font-bold text-foreground mb-4"><Camera size={18} /> Documents justificatifs</h3>
          <p className="text-muted-foreground text-xs mb-4">Téléchargez des photos claires de vos documents pour vérification.</p>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-semibold text-foreground block mb-2">Photo du permis de conduire <span className="text-destructive">*</span></label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setLicensePhoto(e.target.files?.[0] || null)}
                required
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm file:mr-3 file:py-1 file:px-3 file:rounded-md file:border-0 file:bg-primary/10 file:text-primary file:font-semibold file:text-xs"
              />
              {licensePhoto && <p className="text-xs text-muted-foreground mt-1">✓ {licensePhoto.name}</p>}
            </div>
            <div>
              <label className="text-sm font-semibold text-foreground block mb-2">Photo de la carte grise <span className="text-destructive">*</span></label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setCarRegPhoto(e.target.files?.[0] || null)}
                required
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm file:mr-3 file:py-1 file:px-3 file:rounded-md file:border-0 file:bg-primary/10 file:text-primary file:font-semibold file:text-xs"
              />
              {carRegPhoto && <p className="text-xs text-muted-foreground mt-1">✓ {carRegPhoto.name}</p>}
            </div>
          </div>
        </div>

        <button type="submit" disabled={loading} className="w-full py-4 rounded-lg bg-gradient-to-br from-primary to-accent text-primary-foreground font-bold text-base hover:-translate-y-0.5 hover:shadow-lg transition-all disabled:opacity-50 mb-3">
          {loading ? "Inscription..." : "S'inscrire comme conducteur"}
        </button>
      </form>
    </div>
  );
}

export default function CreateRide() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isDriver, setIsDriver] = useState<boolean | null>(null);
  const [driverStatus, setDriverStatus] = useState<"none" | "pending" | "approved" | "rejected">("none");
  const [checkingDriver, setCheckingDriver] = useState(true);
  const [form, setForm] = useState({
    departure_location_name: "",
    arrival_location_name: "",
    date: "",
    time: "",
    vehicle_type: "",
    available_seats: "",
    price_per_seat: "",
    notes: "",
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    checkDriverStatus();
  }, [user]);

  const checkDriverStatus = async () => {
    if (!user) {
      setCheckingDriver(false);
      return;
    }
    try {
      // Prefer new verifyDriver endpoint for authoritative status
      const verify = (await verifyDriver()) as any;
      if (typeof verify?.is_driver === "boolean") {
        setIsDriver(verify.is_driver);
        const s = String(verify?.driver_detail?.status ?? verify?.profile?.driver_status ?? "").toLowerCase().trim();
        if (verify.is_driver) setDriverStatus("approved");
        else if (s === "rejected") setDriverStatus("rejected");
        else if (verify?.driver_detail) setDriverStatus("pending");
        else setDriverStatus("none");
      } else {
        const details = await getDriverDetails();
        const found = (details as any[]).some(
          (d: any) => d.user_id === user.id || d.id === user.email || d.email === user.email
        );
        setIsDriver(found);
        setDriverStatus(found ? "approved" : "none");
      }
    } catch {
      setIsDriver(false);
      setDriverStatus("none");
    } finally {
      setCheckingDriver(false);
    }
  };

  const set = (key: string, val: string) => setForm((p) => ({ ...p, [key]: val }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.departure_location_name || !form.arrival_location_name || !form.date || !form.time || !form.vehicle_type || !form.available_seats || !form.price_per_seat) {
      toast({ title: "Champs requis manquants", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const departureDate = new Date(`${form.date}T${form.time}`);
      const departureTimestamp = Math.floor(departureDate.getTime() / 1000);

      await createRoute({
        user_id: user?.id || 0,
        departure_location_name: form.departure_location_name,
        arrival_location_name: form.arrival_location_name,
        departure_time: departureTimestamp,
        available_seats: Number(form.available_seats),
        price_per_seat: Number(form.price_per_seat),
        notes: form.notes,
        route_description: `${form.departure_location_name} → ${form.arrival_location_name}`,
      });
      toast({ title: "Trajet créé avec succès !" });
      navigate("/profile");
    } catch (err: any) {
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const estimated = Number(form.price_per_seat || 0) * Number(form.available_seats || 1);

  if (checkingDriver) {
    return (
      <Layout>
        <section className="container py-10 text-center">
          <p className="text-muted-foreground">Vérification du statut conducteur...</p>
        </section>
      </Layout>
    );
  }

  return (
    <Layout>
      <section className="container py-10">
        <h1 className="text-3xl font-bold text-accent mb-6">
          {isDriver ? "Créer un trajet" : "Devenir conducteur"}
        </h1>

        {!isDriver ? (
          driverStatus === "pending" ? (
            <div className="max-w-xl mx-auto bg-card border border-border rounded-xl p-6 shadow-sm text-center">
              <ShieldCheck size={48} className="mx-auto text-primary mb-4" />
              <h2 className="text-xl font-bold text-foreground mb-2">Demande en cours</h2>
              <p className="text-muted-foreground text-sm">
                Votre demande conducteur est en cours de vÃ©rification. Vous pourrez crÃ©er un trajet une fois approuvÃ©.
              </p>
            </div>
          ) : driverStatus === "rejected" ? (
            <DriverRegistrationForm user={user} onRegistered={() => { setIsDriver(false); setDriverStatus("pending"); }} />
          ) : (
            <DriverRegistrationForm user={user} onRegistered={() => { setIsDriver(false); setDriverStatus("pending"); }} />
          )
        ) : (
          <div className="max-w-xl mx-auto">
            <form onSubmit={handleSubmit}>
              {/* Route */}
              <div className="bg-card border border-border rounded-xl p-6 mb-5 shadow-sm">
                <h3 className="flex items-center gap-2 font-bold text-foreground mb-4"><MapPin size={18} /> Itinéraire</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-semibold text-foreground block mb-2">Point de départ <span className="text-destructive">*</span></label>
                    <input value={form.departure_location_name} onChange={(e) => set("departure_location_name", e.target.value)} placeholder="ex. Campus principal" required className="w-full px-3 py-3 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary" />
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-foreground block mb-2">Destination <span className="text-destructive">*</span></label>
                    <input value={form.arrival_location_name} onChange={(e) => set("arrival_location_name", e.target.value)} placeholder="ex. Métro Badaro" required className="w-full px-3 py-3 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary" />
                  </div>
                </div>
              </div>

              {/* Date & Time */}
              <div className="bg-card border border-border rounded-xl p-6 mb-5 shadow-sm">
                <h3 className="flex items-center gap-2 font-bold text-foreground mb-4"><Clock size={18} /> Date et heure</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-semibold text-foreground block mb-2">Date <span className="text-destructive">*</span></label>
                    <input type="date" value={form.date} onChange={(e) => set("date", e.target.value)} required className="w-full px-3 py-3 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary" />
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-foreground block mb-2">Heure <span className="text-destructive">*</span></label>
                    <input type="time" value={form.time} onChange={(e) => set("time", e.target.value)} required className="w-full px-3 py-3 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary" />
                  </div>
                </div>
              </div>

              {/* Vehicle */}
              <div className="bg-card border border-border rounded-xl p-6 mb-5 shadow-sm">
                <h3 className="flex items-center gap-2 font-bold text-foreground mb-4"><Car size={18} /> Véhicule et places</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-semibold text-foreground block mb-2">Type de véhicule <span className="text-destructive">*</span></label>
                    <select value={form.vehicle_type} onChange={(e) => set("vehicle_type", e.target.value)} required className="w-full px-3 py-3 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary">
                      <option value="">Sélectionnez...</option>
                      <option value="sedan">Berline</option>
                      <option value="suv">SUV</option>
                      <option value="hatchback">Berline compacte</option>
                      <option value="van">Monospace</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-foreground block mb-2">Places disponibles <span className="text-destructive">*</span></label>
                    <select value={form.available_seats} onChange={(e) => set("available_seats", e.target.value)} required className="w-full px-3 py-3 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary">
                      <option value="">Sélectionnez...</option>
                      {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n} place{n > 1 ? "s" : ""}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              {/* Price */}
              <div className="bg-card border border-border rounded-xl p-6 mb-5 shadow-sm">
                <h3 className="flex items-center gap-2 font-bold text-foreground mb-4"><DollarSign size={18} /> Tarif</h3>
                <label className="text-sm font-semibold text-foreground block mb-2">Prix par place (LBP) <span className="text-destructive">*</span></label>
                <input type="number" value={form.price_per_seat} onChange={(e) => set("price_per_seat", e.target.value)} placeholder="ex. 50000" min="1000" step="1000" required className="w-full px-3 py-3 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary" />
                <div className="bg-muted rounded-lg p-3 mt-3 text-sm text-muted-foreground border-l-[3px] border-primary">
                  Revenus estimés : <strong className="text-foreground">{estimated.toLocaleString()} LBP</strong>
                </div>
              </div>

              {/* Notes */}
              <div className="bg-card border border-border rounded-xl p-6 mb-5 shadow-sm">
                <h3 className="flex items-center gap-2 font-bold text-foreground mb-4"><FileText size={18} /> Notes</h3>
                <label className="text-sm font-semibold text-foreground block mb-2">Description (optionnel)</label>
                <textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} placeholder="ex. Musique classique, pas de bagages volumineux..." rows={4} className="w-full px-3 py-3 rounded-lg border border-border bg-background text-foreground text-sm resize-y focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary" />
              </div>

              <button type="submit" disabled={loading} className="w-full py-4 rounded-lg bg-gradient-to-br from-primary to-accent text-primary-foreground font-bold text-base hover:-translate-y-0.5 hover:shadow-lg transition-all disabled:opacity-50 mb-3">
                {loading ? "Publication..." : "Publier ce trajet"}
              </button>
              <button type="button" onClick={() => navigate("/")} className="w-full py-3 rounded-lg bg-muted text-foreground font-semibold hover:bg-border transition-colors">
                Annuler
              </button>
            </form>
          </div>
        )}
      </section>
    </Layout>
  );
}
