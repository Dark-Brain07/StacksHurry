;; Stacks Hurry - Pilot Registry
;; Let players register a pilot name and track career stats on-chain
;; Deployed to: SP1YH5MXTJT86BZXMFA2T51JF0QVZ8XNYV33QH6MF

;; --- Constants ---
(define-constant DEPLOYER 'SP1YH5MXTJT86BZXMFA2T51JF0QVZ8XNYV33QH6MF)
(define-constant REGISTRATION_FEE u5000) ;; 5000 uSTX to register
(define-constant GAME_RECORD_FEE u500)   ;; 500 uSTX per game record

;; --- Error Codes ---
(define-constant ERR_ALREADY_REGISTERED (err u100))
(define-constant ERR_NAME_TAKEN (err u101))
(define-constant ERR_NAME_TOO_SHORT (err u102))
(define-constant ERR_NOT_REGISTERED (err u103))
(define-constant ERR_TRANSFER_FAILED (err u104))

;; --- Data Maps ---
(define-map pilots
  principal
  {
    name: (string-ascii 32),
    registered-at: uint,
    games-played: uint,
    best-score: uint
  }
)

(define-map name-to-pilot
  (string-ascii 32)
  principal
)

;; --- Data Variables ---
(define-data-var total-pilots uint u0)

;; --- Public Functions ---

;; Register a new pilot with a unique name
(define-public (register-pilot (name (string-ascii 32)))
  (let
    (
      (caller tx-sender)
      (name-len (len name))
    )
    ;; Name must be 3-32 characters
    (asserts! (>= name-len u3) ERR_NAME_TOO_SHORT)

    ;; Caller must not already be registered
    (asserts! (is-none (map-get? pilots caller)) ERR_ALREADY_REGISTERED)

    ;; Name must not be taken
    (asserts! (is-none (map-get? name-to-pilot name)) ERR_NAME_TAKEN)

    ;; Transfer registration fee
    (try! (stx-transfer? REGISTRATION_FEE caller DEPLOYER))

    ;; Store pilot record
    (map-set pilots caller
      {
        name: name,
        registered-at: stacks-block-height,
        games-played: u0,
        best-score: u0
      }
    )

    ;; Store reverse lookup
    (map-set name-to-pilot name caller)

    ;; Increment total pilots
    (var-set total-pilots (+ (var-get total-pilots) u1))

    ;; Emit event
    (print { event: "pilot-registered", player: caller, name: name })

    (ok true)
  )
)

;; Record a game result (updates games-played and best-score)
(define-public (record-game (score uint))
  (let
    (
      (caller tx-sender)
      (pilot-data (unwrap! (map-get? pilots caller) ERR_NOT_REGISTERED))
      (current-best (get best-score pilot-data))
      (current-games (get games-played pilot-data))
    )
    ;; Transfer game record fee
    (try! (stx-transfer? GAME_RECORD_FEE caller DEPLOYER))

    ;; Update pilot record
    (map-set pilots caller
      (merge pilot-data
        {
          games-played: (+ current-games u1),
          best-score: (if (> score current-best) score current-best)
        }
      )
    )

    ;; Emit event
    (print { event: "game-recorded", player: caller, score: score, games-played: (+ current-games u1) })

    (ok true)
  )
)

;; --- Read-only Functions ---

;; Get full pilot record
(define-read-only (get-pilot (player principal))
  (map-get? pilots player)
)

;; Get principal of pilot by name
(define-read-only (get-pilot-by-name (name (string-ascii 32)))
  (map-get? name-to-pilot name)
)

;; Get total registered pilots
(define-read-only (get-total-pilots)
  (var-get total-pilots)
)
