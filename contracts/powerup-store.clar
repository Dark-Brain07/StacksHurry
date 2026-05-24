;; Stacks Hurry - Powerup Store
;; Let players buy permanent powerup upgrades on-chain
;; Deployed to: SP1YH5MXTJT86BZXMFA2T51JF0QVZ8XNYV33QH6MF

;; --- Constants ---
(define-constant DEPLOYER 'SP1YH5MXTJT86BZXMFA2T51JF0QVZ8XNYV33QH6MF)

;; Powerup Type IDs
(define-constant POWERUP_SPEED u1)
(define-constant POWERUP_SHIELD u2)
(define-constant POWERUP_TRIPLESHOT u3)
(define-constant POWERUP_BOUNCE u4)

;; --- Error Codes ---
(define-constant ERR_INVALID_POWERUP (err u100))
(define-constant ERR_TRANSFER_FAILED (err u101))
(define-constant ERR_ALREADY_OWNED (err u102))

;; --- Data Maps ---
(define-map player-powerups
  { player: principal, powerup-id: uint }
  { purchased-at: uint }
)

;; --- Private Helpers ---

;; Get the cost for a given powerup tier
(define-private (get-powerup-cost (powerup-id uint))
  (if (is-eq powerup-id POWERUP_SPEED)
    u2000
    (if (is-eq powerup-id POWERUP_SHIELD)
      u3000
      (if (is-eq powerup-id POWERUP_TRIPLESHOT)
        u5000
        (if (is-eq powerup-id POWERUP_BOUNCE)
          u8000
          u0
        )
      )
    )
  )
)

;; --- Public Functions ---

;; Buy a permanent powerup upgrade
(define-public (buy-powerup (powerup-id uint))
  (let
    (
      (caller tx-sender)
      (cost (get-powerup-cost powerup-id))
    )
    ;; Validate powerup-id is 1-4
    (asserts! (and (>= powerup-id u1) (<= powerup-id u4)) ERR_INVALID_POWERUP)

    ;; Validate cost is non-zero (redundant but safe)
    (asserts! (> cost u0) ERR_INVALID_POWERUP)

    ;; Check if already owned
    (asserts! (is-none (map-get? player-powerups { player: caller, powerup-id: powerup-id })) ERR_ALREADY_OWNED)

    ;; Transfer fee to deployer
    (try! (stx-transfer? cost caller DEPLOYER))

    ;; Record purchase
    (map-set player-powerups
      { player: caller, powerup-id: powerup-id }
      { purchased-at: stacks-block-height }
    )

    ;; Emit event
    (print { event: "powerup-purchased", player: caller, powerup-id: powerup-id, cost: cost })

    (ok powerup-id)
  )
)

;; --- Read-only Functions ---

;; Check if a player owns a specific powerup
(define-read-only (has-powerup (player principal) (powerup-id uint))
  (is-some (map-get? player-powerups { player: player, powerup-id: powerup-id }))
)

;; Get purchase details for a specific powerup
(define-read-only (get-powerup-details (player principal) (powerup-id uint))
  (map-get? player-powerups { player: player, powerup-id: powerup-id })
)

;; Get all powerup ownership status for a player (returns a tuple of booleans)
(define-read-only (get-all-powerups (player principal))
  {
    speed: (is-some (map-get? player-powerups { player: player, powerup-id: POWERUP_SPEED })),
    shield: (is-some (map-get? player-powerups { player: player, powerup-id: POWERUP_SHIELD })),
    tripleshot: (is-some (map-get? player-powerups { player: player, powerup-id: POWERUP_TRIPLESHOT })),
    bounce: (is-some (map-get? player-powerups { player: player, powerup-id: POWERUP_BOUNCE }))
  }
)
