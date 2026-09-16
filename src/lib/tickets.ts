/** Ingresso vale até o fim do dia seguinte ao jogo (horário local). */
export function getTicketExpiresAt(matchDateTime: Date): Date {
  const expires = new Date(matchDateTime);
  expires.setHours(0, 0, 0, 0);
  expires.setDate(expires.getDate() + 2); // meia-noite após o dia seguinte
  return expires;
}

export function isTicketExpired(
  matchDateTime: Date,
  now: Date = new Date()
): boolean {
  return now >= getTicketExpiresAt(matchDateTime);
}

export function isTicketValidForEntry(
  status: string,
  matchDateTime: Date,
  now: Date = new Date()
): boolean {
  return status === "PAID" && !isTicketExpired(matchDateTime, now);
}

export function ticketDisplayStatus(
  status: string,
  matchDateTime: Date,
  now: Date = new Date()
): string {
  if (status === "PAID" && isTicketExpired(matchDateTime, now)) {
    return "EXPIRED";
  }
  return status;
}
