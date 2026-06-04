"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

const ID_TYPES = ["drivers_license", "passport", "state_id"];

// Submit identity documents for verification. In a real build this would call
// an IDV provider (e.g. Persona, Onfido, Stripe Identity) to OCR the ID and run
// a face-match/liveness check. Here we simulate an automated pass.
export async function verifyIdentityAction(payload) {
  const session = await getSession();
  if (!session?.sub) return { error: "Your session has expired. Please sign in again." };

  const idType = ID_TYPES.includes(payload?.idType) ? payload.idType : null;
  const idNumber = String(payload?.idNumber || "").trim();
  const faceCaptured = !!payload?.faceCaptured;

  if (!idType) return { error: "Select a valid ID document type." };
  if (idNumber.length < 4) return { error: "Enter the ID document number." };
  if (!faceCaptured) return { error: "Capture a face photo to complete verification." };

  await prisma.user.update({
    where: { id: session.sub },
    data: {
      kycStatus: "VERIFIED", // simulated automated approval
      idType,
      idLast4: idNumber.slice(-4),
      faceCaptured: true,
      kycVerifiedAt: new Date(),
    },
  });

  revalidatePath("/");
  revalidatePath("/verify");
  revalidatePath("/withdraw");
  revalidatePath("/transfer");
  return { ok: true };
}
