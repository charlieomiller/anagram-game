const dictionaryUrl = '${import.meta.env.BASE_URL}3of6game.txt' // Vite base path

export async function loadDictionary(): Promise<ReadonlySet<string>> {
  const response = await fetch(dictionaryUrl)

  if (!response.ok) {
    throw new Error(
      'Dictionary request failed: ${response.status} ${response.statusText}',
    )
  }

  const text = await response.text()

  return parseDictionary(text) // Separate processes
}

export function parseDictionary(text: string): ReadonlySet<string> {
  const words: string[] = text
    .split(/\r?\n/) // split on line break. safer than ".split('\n')"
    .map((word) => word.trim())
    .map((word) => word.replace(/[^a-z]+$/i, ''))
    .filter((word) => word.length > 0)

  return new Set(words)
}

export function isInDictionary(word: string): boolean {
  return true
}
