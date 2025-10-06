"use client";

import Link from "next/link";
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

type QueueItem = {
  id: string | number;
  ticket_number?: string | number;
  patient_name?: string;
  position?: number;
  status?: string;
  created_at?: string;
};

export default function AdminDashboard() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isDoctorModalOpen, setIsDoctorModalOpen] = useState<boolean>(false);
  const [editingDoctor, setEditingDoctor] = useState<Doctor | null>(null);
  const [doctorName, setDoctorName] = useState<string>("");
  const [doctorSpecialization, setDoctorSpecialization] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Check if user is admin (simple email-based check for now)
  const isAdmin = user?.email === "admin@clinic.com";

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
    fetchQueue();
  }, [user, isAdmin, router]);

  const fetchDoctors = async () => {
    try {
      const { data, error } = await supabase
        .from("doctors")
        .select("*")
        .order("name");

      if (error) {
        setError(error.message);
      } else {
        setDoctors(data ?? []);
      }
    } catch (err) {
      setError("Failed to fetch doctors");
    }
  };

  const fetchQueue = async () => {
    try {
      const { data, error } = await supabase
        .from("queue")
        .select("*")
        .eq("status", "ongoing")
        .order("position", { ascending: true });

      if (error) {
        setError(error.message);
      } else {
        setQueue(data ?? []);
      }
    } catch (err) {
      setError("Failed to fetch queue");
    }
    setLoading(false);
  };

  const handleDoctorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!doctorName.trim()) return;

    setIsSubmitting(true);
    try {
      if (editingDoctor) {
        // Update existing doctor
        const { error } = await supabase
          .from("doctors")
          .update({
            name: doctorName.trim(),
            specialization: doctorSpecialization.trim() || null,
          })
          .eq("id", editingDoctor.id);

        if (error) {
          setError(error.message);
        } else {
          await fetchDoctors();
          closeDoctorModal();
        }
      } else {
        // Create new doctor
        const { error } = await supabase
          .from("doctors")
          .insert([
            {
              name: doctorName.trim(),
              specialization: doctorSpecialization.trim() || null,
              is_active: true,
            },
          ]);

        if (error) {
          setError(error.message);
        } else {
          await fetchDoctors();
          closeDoctorModal();
        }
      }
    } catch (err) {
      setError("Failed to save doctor");
    } finally {
      setIsSubmitting(false);
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
      const { error } = await supabase
        .from("doctors")
        .delete()
        .eq("id", id);

      if (error) {
        setError(error.message);
      } else {
        await fetchDoctors();
      }
    } catch (err) {
      setError("Failed to delete doctor");
    }
  };

  const setInCharge = async (id: string) => {
    try {
      // First, set all to inactive
      const { error: clearError } = await supabase
        .from("doctors")
        .update({ is_active: false });
      if (clearError) {
        setError(clearError.message);
        return;
      }

      // Then set selected to active
      const { error: setErrorActive } = await supabase
        .from("doctors")
        .update({ is_active: true })
        .eq("id", id);
      if (setErrorActive) {
        setError(setErrorActive.message);
        return;
      }

      await fetchDoctors();
    } catch (err) {
      setError("Failed to update in-charge doctor");
    }
  };

  const skipPatient = async (id: string | number) => {
    try {
      const { error } = await supabase
        .from("queue")
        .delete()
        .eq("id", id);

      if (error) {
        setError(error.message);
      } else {
        await fetchQueue();
      }
    } catch (err) {
      setError("Failed to skip patient");
    }
  };

  const proceedPatient = async (id: string | number) => {
    try {
      // Move the patient to the front of the queue (position 1)
      // First, get all ongoing patients to reorder them
      const { data: ongoingPatients, error: fetchError } = await supabase
        .from("queue")
        .select("*")
        .eq("status", "ongoing")
        .order("position", { ascending: true });

      if (fetchError) {
        setError(fetchError.message);
        return;
      }

      // Find the patient to proceed
      const patientToProceed = ongoingPatients?.find(p => p.id === id);
      if (!patientToProceed) {
        setError("Patient not found");
        return;
      }

      // Update all positions: the proceeded patient gets position 1, others shift down
      const updates = ongoingPatients?.map((patient, index) => ({
        id: patient.id,
        position: patient.id === id ? 1 : index + 2
      }));

      // Update positions in batch
      for (const update of updates || []) {
        const { error } = await supabase
          .from("queue")
          .update({ position: update.position })
          .eq("id", update.id);

        if (error) {
          setError(error.message);
          return;
        }
      }

      await fetchQueue();
    } catch (err) {
      setError("Failed to proceed patient");
    }
  };

  const donePatient = async (id: string | number) => {
    try {
      const { error } = await supabase
        .from("queue")
        .update({ status: "completed" })
        .eq("id", id);

      if (error) {
        setError(error.message);
      } else {
        await fetchQueue();
      }
    } catch (err) {
      setError("Failed to mark patient as done");
    }
  };


  const deletePatient = async (id: string | number) => {
    if (!confirm("Are you sure you want to delete this patient from the queue?")) return;

    try {
      const { error } = await supabase
        .from("queue")
        .delete()
        .eq("id", id);

      if (error) {
        setError(error.message);
      } else {
        await fetchQueue();
      }
    } catch (err) {
      setError("Failed to delete patient");
    }
  };

  if (!user || !isAdmin) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-dvh flex flex-col">
      {/* Header */}
      <header className="w-full border-b border-black/[.06] dark:border-white/[.08]">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="font-semibold">Admin Dashboard</div>
          <nav className="flex items-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-md h-9 px-3 text-sm font-medium border border-black/[.08] dark:border-white/[.145] hover:bg-black/[.04] dark:hover:bg-white/[.06] transition"
            >
              View Queue
            </Link>
            <button
              onClick={async () => {
                await signOut();
                router.push("/");
              }}
              className="inline-flex items-center justify-center rounded-md h-9 px-3 text-sm font-medium bg-red-600 text-white hover:bg-red-700 transition"
            >
              Logout
            </button>
          </nav>
        </div>
      </header>

      <main className="flex-1 px-6 py-10">
        <div className="max-w-6xl mx-auto space-y-8">
          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {/* Doctors Management */}
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
                <div
                  key={doctor.id}
                  className="p-4 border border-black/[.08] dark:border-white/[.145] rounded-lg"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">{doctor.name}</h3>
                    {doctor.is_active && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300">In charge</span>
                    )}
                  </div>
                  {doctor.specialization && (
                    <p className="text-sm text-foreground/70 mt-1">
                      {doctor.specialization}
                    </p>
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

          {/* Queue Management */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Queue Management</h2>
              <button
                onClick={fetchQueue}
                className="inline-flex items-center justify-center rounded-md h-9 px-3 text-sm font-medium border border-black/[.08] dark:border-white/[.145] hover:bg-black/[.04] dark:hover:bg-white/[.06] transition"
              >
                Refresh
              </button>
            </div>

            {loading ? (
              <div className="text-foreground/70">Loading queue...</div>
            ) : queue.length === 0 ? (
              <div className="text-foreground/70">No patients in queue.</div>
            ) : (
              <div className="space-y-3">
                {queue.map((item, index) => (
                  <div
                    key={String(item.id)}
                    className={`p-4 border rounded-lg ${
                      index === 0
                        ? "border-emerald-500/50 dark:border-emerald-400/50 bg-emerald-50 dark:bg-emerald-950/30"
                        : "border-black/[.08] dark:border-white/[.145]"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-md bg-foreground text-background flex items-center justify-center text-lg font-semibold">
                          {item.position ?? "-"}
                        </div>
                        <div>
                          <div className="font-medium">
                            {item.patient_name || "Patient"}
                          </div>
                          <div className="text-sm text-foreground/70">
                            Ticket {item.ticket_number ?? "—"}
                            {index === 0 && " • Right now"}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => skipPatient(item.id)}
                          className="text-xs px-3 py-1 bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300 rounded hover:bg-yellow-200 dark:hover:bg-yellow-800 transition"
                        >
                          Skip
                        </button>
                        <button
                          onClick={() => proceedPatient(item.id)}
                          className="text-xs px-3 py-1 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded hover:bg-green-200 dark:hover:bg-green-800 transition"
                        >
                          Proceed
                        </button>
                        <button
                          onClick={() => donePatient(item.id)}
                          className="text-xs px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded hover:bg-blue-200 dark:hover:bg-blue-800 transition"
                        >
                          Done
                        </button>
                        <button
                          onClick={() => deletePatient(item.id)}
                          className="text-xs px-3 py-1 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 rounded hover:bg-red-200 dark:hover:bg-red-800 transition"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>

      {/* Doctor Modal */}
      {isDoctorModalOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/50"
            onClick={closeDoctorModal}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Doctor Management"
            className="fixed inset-0 flex items-center justify-center p-4"
          >
            <div className="w-full max-w-md rounded-lg border border-black/[.08] dark:border-white/[.145] bg-background shadow-xl">
              <div className="px-4 py-3 border-b border-black/[.06] dark:border-white/[.08] flex items-center justify-between">
                <div className="font-semibold">
                  {editingDoctor ? "Edit Doctor" : "Add Doctor"}
                </div>
                <button
                  onClick={closeDoctorModal}
                  className="inline-flex items-center justify-center rounded-md h-9 px-3 text-sm font-medium border border-black/[.08] dark:border-white/[.145] hover:bg-black/[.04] dark:hover:bg-white/[.06] transition"
                >
                  Close
                </button>
              </div>
              <form onSubmit={handleDoctorSubmit} className="p-4 space-y-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-foreground/80">
                    Doctor Name
                  </label>
                  <input
                    type="text"
                    value={doctorName}
                    onChange={(e) => setDoctorName(e.target.value)}
                    placeholder="Enter doctor name"
                    className="w-full rounded-md border border-black/[.08] dark:border-white/[.145] px-3 h-10 bg-background"
                    disabled={isSubmitting}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-foreground/80">
                    Specialization (Optional)
                  </label>
                  <input
                    type="text"
                    value={doctorSpecialization}
                    onChange={(e) => setDoctorSpecialization(e.target.value)}
                    placeholder="e.g., Cardiology, Pediatrics"
                    className="w-full rounded-md border border-black/[.08] dark:border-white/[.145] px-3 h-10 bg-background"
                    disabled={isSubmitting}
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={closeDoctorModal}
                    className="flex-1 inline-flex items-center justify-center rounded-md h-10 px-4 text-sm font-medium border border-black/[.08] dark:border-white/[.145] hover:bg-black/[.04] dark:hover:bg-white/[.06] transition"
                    disabled={isSubmitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 inline-flex items-center justify-center rounded-md h-10 px-4 text-sm font-medium bg-foreground text-background hover:opacity-90 transition disabled:opacity-60"
                    disabled={isSubmitting || !doctorName.trim()}
                  >
                    {isSubmitting ? "Saving..." : editingDoctor ? "Update" : "Add"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
