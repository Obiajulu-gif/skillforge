(use-trait sip-010-trait 'SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE.sip-010-trait-ft-standard.sip-010-trait)

(define-constant err-not-found (err u100))
(define-constant err-not-seller (err u101))
(define-constant err-invalid-price (err u102))
(define-constant err-invalid-metadata (err u103))
(define-constant err-duplicate-purchase (err u104))
(define-constant err-inactive-listing (err u105))
(define-constant err-asset-mismatch (err u106))

(define-data-var next-listing-id uint u1)

(define-map listings
  { listing-id: uint }
  {
    seller: principal,
    metadata-uri: (string-ascii 256),
    payment-asset: principal,
    price: uint,
    active: bool,
    purchase-count: uint,
    created-at: uint,
    updated-at: uint
  }
)

(define-map purchases
  { listing-id: uint, buyer: principal }
  {
    seller: principal,
    payment-asset: principal,
    amount-paid: uint,
    purchased-at: uint
  }
)

(define-private (get-listing-or-fail (listing-id uint))
  (match (map-get? listings { listing-id: listing-id })
    listing (ok listing)
    err-not-found
  )
)

(define-private (assert-seller (listing-id uint))
  (let ((listing (try! (get-listing-or-fail listing-id))))
    (begin
      (asserts! (is-eq tx-sender (get seller listing)) err-not-seller)
      (ok listing)
    )
  )
)

(define-private (is-empty-string (value (string-ascii 256)))
  (is-eq value "")
)

(define-public (create-listing (payment-asset <sip-010-trait>) (price uint) (metadata-uri (string-ascii 256)))
  (begin
    (asserts! (> price u0) err-invalid-price)
    (asserts! (not (is-empty-string metadata-uri)) err-invalid-metadata)
    (let
      (
        (listing-id (var-get next-listing-id))
        (now stacks-block-height)
      )
      (map-set listings
        { listing-id: listing-id }
        {
          seller: tx-sender,
          metadata-uri: metadata-uri,
          payment-asset: (contract-of payment-asset),
          price: price,
          active: true,
          purchase-count: u0,
          created-at: now,
          updated-at: now
        }
      )
      (var-set next-listing-id (+ listing-id u1))
      (ok listing-id)
    )
  )
)

(define-public (update-listing (listing-id uint) (payment-asset <sip-010-trait>) (price uint) (metadata-uri (string-ascii 256)))
  (let ((listing (try! (assert-seller listing-id))))
    (begin
      (asserts! (> price u0) err-invalid-price)
      (asserts! (not (is-empty-string metadata-uri)) err-invalid-metadata)
      (map-set listings
        { listing-id: listing-id }
        (merge listing
          {
            payment-asset: (contract-of payment-asset),
            price: price,
            metadata-uri: metadata-uri,
            updated-at: stacks-block-height
          }
        )
      )
      (ok true)
    )
  )
)

(define-public (set-listing-status (listing-id uint) (active bool))
  (let ((listing (try! (assert-seller listing-id))))
    (begin
      (map-set listings
        { listing-id: listing-id }
        (merge listing
          {
            active: active,
            updated-at: stacks-block-height
          }
        )
      )
      (ok active)
    )
  )
)

(define-public (purchase-listing (listing-id uint) (payment-asset <sip-010-trait>))
  (let
    (
      (listing (try! (get-listing-or-fail listing-id)))
      (purchase-key { listing-id: listing-id, buyer: tx-sender })
      (payment-contract (contract-of payment-asset))
      (price (get price listing))
      (seller (get seller listing))
    )
    (begin
      (asserts! (get active listing) err-inactive-listing)
      (asserts! (is-eq payment-contract (get payment-asset listing)) err-asset-mismatch)
      (asserts! (> price u0) err-invalid-price)
      (asserts! (is-none (map-get? purchases purchase-key)) err-duplicate-purchase)
      (try! (contract-call? payment-asset transfer price tx-sender seller none))
      (map-set purchases purchase-key
        {
          seller: seller,
          payment-asset: payment-contract,
          amount-paid: price,
          purchased-at: stacks-block-height
        }
      )
      (map-set listings
        { listing-id: listing-id }
        (merge listing { purchase-count: (+ (get purchase-count listing) u1), updated-at: stacks-block-height })
      )
      (ok true)
    )
  )
)

(define-read-only (get-listing-count)
  (ok (- (var-get next-listing-id) u1))
)

(define-read-only (get-listing (listing-id uint))
  (ok (map-get? listings { listing-id: listing-id }))
)

(define-read-only (get-purchase (listing-id uint) (buyer principal))
  (ok (map-get? purchases { listing-id: listing-id, buyer: buyer }))
)

(define-read-only (has-access (listing-id uint) (buyer principal))
  (ok (is-some (map-get? purchases { listing-id: listing-id, buyer: buyer })))
)
