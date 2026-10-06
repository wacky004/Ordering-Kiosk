# 10 · Grading Rubric

Total: **100 points**. Adjust weights to suit your course.

## Functionality (40)

| Item | Points | Looks for |
| --- | ---: | --- |
| Menu & cart | 8 | browse, search, filter, quantity, merge by options, persistence |
| Accounts | 6 | register, login, logout, sessions, hashed passwords |
| Checkout & pricing | 10 | server-computed totals, options pricing, VAT, Senior/PWD, points |
| Order placement & receipt | 6 | order saved, points credited, printable receipt |
| Status & tracking | 6 | full state machine, timeline, live updates |
| Admin & roles | 4 | correct screens per role, RBAC enforced |

## Code quality (25)

| Item | Points | Looks for |
| --- | ---: | --- |
| Structure | 8 | clear separation (routes / logic / data), small modules |
| Business rules isolated | 6 | pricing and state machine are pure and testable |
| Validation & errors | 6 | bad input handled with clear messages and status codes |
| Readability | 5 | naming, no dead code, no copy-paste duplication |

## Testing (15)

| Item | Points | Looks for |
| --- | ---: | --- |
| Unit tests | 7 | pricing and state machine covered |
| Integration tests | 5 | auth, RBAC, order flow |
| Test hygiene | 3 | isolated data, no reliance on real DB/network |

## Security (10)

| Item | Points | Looks for |
| --- | ---: | --- |
| Passwords & sessions | 4 | bcrypt, httpOnly cookie, secret not hard-coded |
| Authorization | 4 | role checks on the server, not just hidden buttons |
| Input trust | 2 | never trust client prices/roles |

## UI / UX (10)

| Item | Points | Looks for |
| --- | ---: | --- |
| Responsiveness | 4 | works on phone, tablet, desktop |
| Clarity | 3 | obvious next action, clear feedback, toasts/errors |
| Polish | 3 | consistent spacing, loading and empty states |

## Deductions

- App does not run with the documented command: **−10**
- Prices or points trusted from the client: **−10**
- Hard-coded plaintext passwords in the database: **−5**
- Missing receipts or points: **−5**

## Bonus (+ up to 10)

- Real-time via SSE (+2) · Offline single-file build (+3) · Extra tests (+2) ·
  Inventory or refunds (+3) · Thoughtful documentation (+2)
