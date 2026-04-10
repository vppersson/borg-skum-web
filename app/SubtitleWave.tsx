'use client'

import {useState} from 'react'

function Word({word}: {word: string}) {
  const [key, setKey] = useState(0)

  return (
    <span
      onMouseEnter={() => setKey((k) => k + 1)}
      style={{
        display: 'inline-block',
        animation:
          key > 0
            ? `bs-word-bounce-${key % 2 === 0 ? 'a' : 'b'} 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)`
            : undefined,
      }}
    >
      {word}
    </span>
  )
}

export function SubtitleWave({text}: {text: string}) {
  return (
    <span aria-label={text}>
      {text.split(' ').map((word, i, arr) => (
        <span key={i}>
          <Word word={word} />
          {i < arr.length - 1 && ' '}
        </span>
      ))}
    </span>
  )
}
