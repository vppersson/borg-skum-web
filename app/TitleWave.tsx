'use client'

import {useState} from 'react'

function Letter({char}: {char: string}) {
  const [key, setKey] = useState(0)

  return (
    <span
      onMouseEnter={() => setKey((k) => k + 1)}
      style={{
        display: 'inline-block',
        animation:
          key > 0
            ? `bs-letter-bounce-${key % 2 === 0 ? 'a' : 'b'} 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)`
            : undefined,
      }}
    >
      {char}
    </span>
  )
}

export function TitleWave({text}: {text: string}) {
  return (
    <span aria-label={text}>
      {text.split('').map((char, i) =>
        char === ' ' ? (
          <span key={i} style={{display: 'inline-block'}}>&nbsp;</span>
        ) : (
          <Letter key={i} char={char} />
        ),
      )}
    </span>
  )
}
