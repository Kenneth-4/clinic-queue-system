"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/context/AuthProvider";
import { useRouter } from "next/navigation";

type Doctor = {
  id: string;
  name: string;
  specialization?: string;
  is_active: boolean;
  created_at: string;
};

export default function DoctorsAdminPage() {
  const { user } = useAuth();
  const router = useRouter();
  const isAdmin = user?.email === "admin@clinic.com";

  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isDoctorModalOpen, setIsDoctorModalOpen] = useState<boolean>(false);
  const [editingDoctor, setEditingDoctor] = useState<Doctor | null>(null);
  const [doctorName, setDoctorName] = useState<string>("");
  const [doctorSpecialization, setDoctorSpecialization] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (!user) {
      router.push("/login");
      return;
    }
    if (!isAdmin) {
      router.push("/");
      return;
    }
    fetchDoctors();
  }, [user, isAdmin, router]);

  const fetchDoctors = async () => {
    try {
      const { data, error } = await supabase
        .from("doctors")
        .select("*")
        .order("name");
      if (error) setError(error.message);
      else setDoctors(data ?? []);
    } catch {
      setError("Failed to fetch doctors");
    }
  };

  const closeDoctorModal = () => {
    setIsDoctorModalOpen(false);
    setEditingDoctor(null);
    setDoctorName("");
    setDoctorSpecialization("");
  };

  const editDoctor = (doctor: Doctor) => {
    setEditingDoctor(doctor);
    setDoctorName(doctor.name);
    setDoctorSpecialization(doctor.specialization || "");
    setIsDoctorModalOpen(true);
  };

  const deleteDoctor = async (id: string) => {
    if (!confirm("Are you sure you want to delete this doctor?")) return;
    try {
      const { error } = await supabase.from("doctors").delete().eq("id", id);
      if (error) setError(error.message);
      else await fetchDoctors();
    } catch {
      setError("Failed to delete doctor");
    }
  };

  const setInCharge = async (id: string) => {
    try {
      const { error: clearError } = await supabase.from("doctors").update({ is_active: false });
      if (clearError) return setError(clearError.message);

      const { error: setErrorActive } = await supabase
        .from("doctors")
        .update({ is_active: true })
        .eq("id", id);
      if (setErrorActive) return setError(setErrorActive.message);

      await fetchDoctors();
    } catch {
      setError("Failed to update in-charge doctor");
    }
  };

  const handleDoctorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!doctorName.trim()) return;
    setIsSubmitting(true);
    try {
      if (editingDoctor) {
        const { error } = await supabase
          .from("doctors")
          .update({ name: doctorName.trim(), specialization: doctorSpecialization.trim() || null })
          .eq("id", editingDoctor.id);
        if (error) setError(error.message);
        else {
          await fetchDoctors();
          closeDoctorModal();
        }
      } else {
        const { error } = await supabase
          .from("doctors")
          .insert([{ name: doctorName.trim(), specialization: doctorSpecialization.trim() || null, is_active: true }]);
        if (error) setError(error.message);
        else {
          await fetchDoctors();
          closeDoctorModal();
        }
      }
    } catch {
      setError("Failed to save doctor");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Doctors Management</h2>
          <button
            onClick={() => setIsDoctorModalOpen(true)}
            className="inline-flex items-center justify-center rounded-md h-9 px-3 text-sm font-medium bg-foreground text-background hover:opacity-90 transition"
          >
            Add Doctor
          </button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {doctors.map((doctor) => (
            <div key={doctor.id} className="p-4 border border-black/[.08] dark:border-white/[.145] rounded-lg">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">{doctor.name}</h3>
                {doctor.is_active && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300">In charge</span>
                )}
              </div>
              {doctor.specialization && (
                <p className="text-sm text-foreground/70 mt-1">{doctor.specialization}</p>
              )}
              <div className="flex gap-2 mt-3 flex-wrap">
                <button
                  onClick={() => setInCharge(doctor.id)}
                  className="text-xs px-2 py-1 bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 rounded hover:bg-emerald-200 dark:hover:bg-emerald-800 transition disabled:opacity-60"
                  disabled={doctor.is_active}
                >
                  {doctor.is_active ? "In charge" : "Set In Charge"}
                </button>
                <button
                  onClick={() => editDoctor(doctor)}
                  className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded hover:bg-blue-200 dark:hover:bg-blue-800 transition"
                >
                  Edit
                </button>
                <button
                  onClick={() => deleteDoctor(doctor.id)}
                  className="text-xs px-2 py-1 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 rounded hover:bg-red-200 dark:hover:bg-red-800 transition"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {isDoctorModalOpen && (
        <>
          <div className="fixed inset-0 bg-black/50" onClick={closeDoctorModal} />
          <div role="dialog" aria-modal="true" aria-label="Doctor Management" className="fixed inset-0 flex items-center justify-center p-4">
            <div className="w-full max-w-md rounded-lg border border-black/[.08] dark:border-white/[.145] bg-background shadow-xl">
              <div className="px-4 py-3 border-b border-black/[.06] dark:border-white/[.08] flex items-center justify-between">
                <div className="font-semibold">{editingDoctor ? "Edit Doctor" : "Add Doctor"}</div>
                <button onClick={closeDoctorModal} className="inline-flex items-center justify-center rounded-md h-9 px-3 text-sm font-medium border border-black/[.08] dark:border-white/[.145] hover:bg-black/[.04] dark:hover:bg-white/[.06] transition">Close</button>
              </div>
              <form onSubmit={handleDoctorSubmit} className="p-4 space-y-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-foreground/80">Doctor Name</label>
                  <input type="text" value={doctorName} onChange={(e) => setDoctorName(e.target.value)} placeholder="Enter doctor name" className="w-full rounded-md border border-black/[.08] dark:border-white/[.145] px-3 h-10 bg-background" disabled={isSubmitting} required />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-foreground/80">Specialization (Optional)</label>
                  <input type="text" value={doctorSpecialization} onChange={(e) => setDoctorSpecialization(e.target.value)} placeholder="e.g., Cardiology, Pediatrics" className="w-full rounded-md border border-black/[.08] dark:border-white/[.145] px-3 h-10 bg-background" disabled={isSubmitting} />
                </div>
                <div className="flex gap-2 pt-2">
                  <button type="button" onClick={closeDoctorModal} className="flex-1 inline-flex items-center justify-center rounded-md h-10 px-4 text-sm font-medium border border-black/[.08] dark:border-white/[.145] hover:bg-black/[.04] dark:hover:bg-white/[.06] transition" disabled={isSubmitting}>Cancel</button>
                  <button type="submit" className="flex-1 inline-flex items-center justify-center rounded-md h-10 px-4 text-sm font-medium bg-foreground text-background hover:opacity-90 transition disabled:opacity-60" disabled={isSubmitting || !doctorName.trim()}>{isSubmitting ? "Saving..." : editingDoctor ? "Update" : "Add"}</button>
                </div>
              </form>
            </div>
          </div>
        </>
      )}
    </div>
  );
}



