;; Stacks Hurry - Daily Quest Tracker
;; Tracks daily quest completions on-chain per player wallet
;; Deployed to: SP1YH5MXTJT86BZXMFA2T51JF0QVZ8XNYV33QH6MF

;; --- Constants ---
(define-constant DEPLOYER 'SP1YH5MXTJT86BZXMFA2T51JF0QVZ8XNYV33QH6MF)
(define-constant QUEST_FEE u1000) ;; 1000 uSTX per quest completion

;; --- Error Codes ---
(define-constant ERR_INVALID_QUEST (err u100))
(define-constant ERR_TRANSFER_FAILED (err u101))
(define-constant ERR_ALREADY_COMPLETED (err u102))

;; --- Data Maps ---
(define-map quest-completions
  { player: principal, quest-id: uint }
  { block-height: uint, score: uint }
)

(define-map player-quest-count
  principal
  uint
)

;; --- Public Functions ---

;; @desc Complete a daily quest on-chain
;; @desc Complete a daily quest and claim points
(define-public (complete-quest (quest-id uint) (score uint))
  (let
    (
      (caller tx-sender)
      (current-count (default-to u0 (map-get? player-quest-count caller)))
    )
    ;; Validate quest-id is within valid range (1-14 matching MASTER_QUEST_POOL)
    (asserts! (and (>= quest-id u1) (<= quest-id u14)) ERR_INVALID_QUEST)

    ;; Transfer fee to deployer
    (try! (stx-transfer? QUEST_FEE caller DEPLOYER))

    ;; Record quest completion
    (map-set quest-completions
      { player: caller, quest-id: quest-id }
      { block-height: stacks-block-height, score: score }
    )

    ;; Increment player quest count
    (map-set player-quest-count caller (+ current-count u1))

    ;; Emit event
    (print { event: "quest-complete", player: caller, quest-id: quest-id, score: score })

    (ok true)
  )
)

;; --- Read-only Functions ---

;; Get quest completion status for a player
(define-read-only (get-quest-status (player principal) (quest-id uint))
  (map-get? quest-completions { player: player, quest-id: quest-id })
)

;; Get total quests completed by a player
(define-read-only (get-player-total-quests (player principal))
  (default-to u0 (map-get? player-quest-count player))
)
