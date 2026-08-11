export type PlayedWord = {
  id: number
  word: string
}
export type GameState = {
  letterPool: string[]
  playedWords: PlayedWord[]
  selectedWords: PlayedWord[]
  nextWordId: number
  score: number
}

export type PlayerMove = {
  word: string
  selectedWords: PlayedWord[]
}
