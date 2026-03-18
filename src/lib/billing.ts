import { differenceInCalendarDays, parseISO } from "date-fns";
import type { EstablishmentProfileRow, NormalizedBillingStatus } from "./types";

const PROFISSIONAL_CENTS = 19700;
const PRO_IA_CENTS = 34700;

export function normalizeStatus(row: EstablishmentProfileRow): NormalizedBillingStatus {
  const subStatus = String(row.subscription?.status ?? "").toLowerCase();

  // Reembolso (se aparecer via status/meta/event no futuro)
  if (subStatus.includes("refund") || subStatus.includes("reemb")) return "reembolsado";

  // ATRASADO (inclui cancelado) — regra do Diego: 10h do dia seguinte cancela, então não faz sentido separar.
  const acessoAte = row.cadastro?.acesso_ate;
  if (acessoAte) {
    try {
      if (parseISO(acessoAte).getTime() < Date.now()) return "atrasado";
    } catch {
      // ignore
    }
  }

  // Se subscription não está active, tratamos como atrasado/cancelado (mesma categoria)
  if (subStatus && subStatus !== "active") return "atrasado";

  // Ativo
  if (subStatus === "active") return "ativo";

  return "desconhecido";
}

export function planLabel(planId: string | null): string {
  const p = String(planId ?? "").toLowerCase();
  if (p === "pro_ia") return "PRO + IA";
  if (p === "profissional") return "Profissional";
  return p || "Sem plano";
}

export function planAmountCents(planId: string | null): number {
  const p = String(planId ?? "").toLowerCase();
  if (p === "pro_ia") return PRO_IA_CENTS;
  return PROFISSIONAL_CENTS;
}

export function computeAccessUntil(row: EstablishmentProfileRow): Date | null {
  const acessoAte = row.cadastro?.acesso_ate;
  if (!acessoAte) return null;
  try {
    return parseISO(acessoAte);
  } catch {
    return null;
  }
}

export function isDueInFiveDays(row: EstablishmentProfileRow, now = new Date()): boolean {
  const due = computeAccessUntil(row);
  if (!due) return false;
  const days = differenceInCalendarDays(due, now);
  return days >= 0 && days <= 5;
}

export function toCurrency(valueCents: number | null | undefined): string {
  const value = Number(valueCents ?? 0) / 100;
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}
