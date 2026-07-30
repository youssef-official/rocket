// Version labels are intentionally local and deterministic. Naming a version
// should never wait on a second AI request after the website has finished.
export async function generateVersionName(
  _projectDescription: string,
  changeDescription?: string,
  versionNumber?: number
): Promise<string> {
  const number = versionNumber || 1;
  const action = number === 1 ? 'Initial Build' : 'Website Update';
  return `${action} ${number}`;
}
