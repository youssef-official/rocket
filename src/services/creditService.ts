// Local stub — credits removed.
export async function deductCredits(
  _userId: string,
  _projectId?: string,
  _description?: string,
  _credits: number = 0
): Promise<{ creditsDeducted: number; success: boolean }> {
  return { creditsDeducted: 0, success: true };
}
