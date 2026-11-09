type PlanetIllustrationProps = {
  className?: string;
};

export function PlanetIllustration({ className }: PlanetIllustrationProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 640 540"
      width={640}
      height={540}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <radialGradient id="muse-planet-surface" cx="27%" cy="21%" r="78%">
          <stop offset="0" stopColor="#BFE5C5" />
          <stop offset="0.42" stopColor="#6FA875" />
          <stop offset="0.78" stopColor="#2D5A27" />
          <stop offset="1" stopColor="#173E25" />
        </radialGradient>
        <linearGradient id="muse-planet-ring" x1="112" y1="165" x2="520" y2="396" gradientUnits="userSpaceOnUse">
          <stop stopColor="#F4D9AE" />
          <stop offset="0.28" stopColor="#B87333" />
          <stop offset="0.54" stopColor="#F0C98F" />
          <stop offset="0.78" stopColor="#9E5928" />
          <stop offset="1" stopColor="#E7BC7B" />
        </linearGradient>
        <linearGradient id="muse-planet-moon" x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#FFF7E8" />
          <stop offset="1" stopColor="#C9DDE1" />
        </linearGradient>
        <clipPath id="muse-planet-ring-front">
          <rect x="0" y="278" width="640" height="262" />
        </clipPath>
      </defs>

      <g className="planet-art-stars">
        <path className="planet-art-star planet-art-star--one" d="M103 90L109 108L127 114L109 120L103 138L97 120L79 114L97 108L103 90Z" fill="#B87333" />
        <path className="planet-art-star planet-art-star--two" d="M527 112L531 124L543 128L531 132L527 144L523 132L511 128L523 124L527 112Z" fill="#E2A85F" />
        <path className="planet-art-star planet-art-star--three" d="M542 380L547 394L561 399L547 404L542 418L537 404L523 399L537 394L542 380Z" fill="#B87333" />
        <circle cx="152" cy="368" r="3" fill="#DDAF72" />
        <circle cx="475" cy="185" r="3" fill="#86B8C0" />
        <circle cx="446" cy="438" r="2.5" fill="#86B8C0" />
      </g>

      <ellipse
        className="planet-art-ring"
        cx="320"
        cy="276"
        rx="248"
        ry="106"
        transform="rotate(-23 320 276)"
        stroke="url(#muse-planet-ring)"
        strokeWidth="22"
        strokeLinecap="round"
      />
      <ellipse
        cx="320"
        cy="276"
        rx="248"
        ry="106"
        transform="rotate(-23 320 276)"
        stroke="#FFF4E0"
        strokeOpacity="0.58"
        strokeWidth="3"
      />

      <circle className="planet-art-sphere" cx="320" cy="276" r="143" fill="url(#muse-planet-surface)" />
      <ellipse cx="274" cy="222" rx="59" ry="31" transform="rotate(-34 274 222)" fill="#FFF" fillOpacity="0.22" />
      <path d="M221 293C258 266 294 274 320 299C344 323 382 330 412 310" stroke="#D6EAD3" strokeOpacity="0.34" strokeWidth="13" strokeLinecap="round" />
      <path d="M238 344C274 324 304 333 325 351C348 370 377 373 397 359" stroke="#173E25" strokeOpacity="0.28" strokeWidth="16" strokeLinecap="round" />

      <ellipse
        className="planet-art-ring planet-art-ring--front"
        cx="320"
        cy="276"
        rx="248"
        ry="106"
        transform="rotate(-23 320 276)"
        clipPath="url(#muse-planet-ring-front)"
        stroke="url(#muse-planet-ring)"
        strokeWidth="22"
        strokeLinecap="round"
      />
      <ellipse
        cx="320"
        cy="276"
        rx="248"
        ry="106"
        transform="rotate(-23 320 276)"
        clipPath="url(#muse-planet-ring-front)"
        stroke="#FFF4E0"
        strokeOpacity="0.58"
        strokeWidth="3"
      />

      <circle className="planet-art-moon" cx="154" cy="166" r="19" fill="url(#muse-planet-moon)" />
      <circle cx="148" cy="160" r="5" fill="#FFF" fillOpacity="0.8" />
      <circle className="planet-art-moon planet-art-moon--small" cx="485" cy="365" r="11" fill="#E0F2FE" />
      <path d="M101 432C110 419 132 419 140 432C148 431 155 437 155 445H91C91 438 95 433 101 432Z" fill="#FFF" fillOpacity="0.82" />
      <path d="M479 90C485 81 500 81 506 90C512 90 517 95 517 101H472C472 96 475 91 479 90Z" fill="#FFF" fillOpacity="0.72" />
    </svg>
  );
}
