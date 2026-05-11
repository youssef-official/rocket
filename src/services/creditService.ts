export async function deductCredits(_u: string, _p?: string, _d?: string, _c: number = 0) {
  return { creditsDeducted: 0, success: true };
}
export async function checkCreditsAvailable(_u: string, _c: number = 0) {
  return { available: true, remaining: 999_999 };
}
