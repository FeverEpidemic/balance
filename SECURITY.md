# Security Policy

## Reporting a Vulnerability

**Balance** is a financial application — security is a top priority.

If you discover a security vulnerability, **do NOT open a public issue**. Instead, report it privately using one of these methods:

1. **GitHub Private Vulnerability Reporting** — Go to the repository's [Security tab](https://github.com/FeverEpidemic/balance/security/advisories) and click "Report a vulnerability".
2. **Email** — Send details to the repository owner via their GitHub profile: [github.com/FeverEpidemic](https://github.com/FeverEpidemic)

Please include:
- A description of the vulnerability
- Steps to reproduce (if applicable)
- Potential impact
- Any suggested fix (optional)

## Response Timeline

| Timeframe | Expected |
|-----------|----------|
| **72 hours** | Initial acknowledgment |
| **7 days** | Triage and severity assessment |
| **30 days** | Fix deployed (for critical issues) |

## Scope

The following are **in scope**:
- Authentication bypass
- Data exposure (unauthorized access to other users' data)
- SQL injection, XSS, CSRF
- RCE or server-side code execution
- Privilege escalation

The following are **out of scope**:
- Self-hosted deployments (you control your own infrastructure)
- Rate limiting bypass (rate limits are documented features)
- Feature availability on free tier (by design)

## Supported Versions

Only the latest release on the `main` branch receives security patches. Self-hosted users should regularly pull the latest changes.

## Disclosure

We follow **coordinated disclosure**: we will work with you to understand the issue, develop a fix, and release it before making the vulnerability public.

## Recognition

We maintain a list of security researchers who have responsibly reported vulnerabilities (with their permission).
