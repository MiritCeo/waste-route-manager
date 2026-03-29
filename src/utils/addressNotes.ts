/** Wyciąga nazwę firmy z linii „Właściciel:” w polu notatek adresu (jak w API). */
export const extractOwnerFromNotes = (notes?: string | null): string | undefined => {
  if (!notes) return undefined;
  const line = notes.split('\n').find(item => item.startsWith('Właściciel:'));
  if (!line) return undefined;
  const name = line.replace('Właściciel:', '').trim();
  return name || undefined;
};
