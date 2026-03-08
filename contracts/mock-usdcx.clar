(impl-trait 'SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE.sip-010-trait-ft-standard.sip-010-trait)

(define-fungible-token mock-usdcx)

(define-constant err-not-authorized (err u100))
(define-constant token-owner tx-sender)
(define-constant token-uri (some u"https://skillforge.dev/mock-usdcx"))

(define-public (transfer (amount uint) (sender principal) (recipient principal) (memo (optional (buff 34))))
  (begin
    (asserts! (is-eq tx-sender sender) err-not-authorized)
    (try! (ft-transfer? mock-usdcx amount sender recipient))
    (match memo memo-buff (print memo-buff) 0x)
    (ok true)
  )
)

(define-public (mint (amount uint) (recipient principal))
  (begin
    (asserts! (is-eq tx-sender token-owner) err-not-authorized)
    (ft-mint? mock-usdcx amount recipient)
  )
)

(define-read-only (get-name)
  (ok "Mock USDCx")
)

(define-read-only (get-symbol)
  (ok "USDCx")
)

(define-read-only (get-decimals)
  (ok u6)
)

(define-read-only (get-balance (who principal))
  (ok (ft-get-balance mock-usdcx who))
)

(define-read-only (get-total-supply)
  (ok (ft-get-supply mock-usdcx))
)

(define-read-only (get-token-uri)
  (ok token-uri)
)
