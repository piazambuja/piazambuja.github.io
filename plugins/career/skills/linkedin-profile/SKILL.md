---
name: linkedin-profile
description: Audit and rewrite a LinkedIn profile to attract recruiters for a target role - headline, About, experience bullets, skills/keywords, Featured section and recruiter outreach messages. Use when the user shares their LinkedIn profile or CV, or asks to improve their LinkedIn, get more recruiter messages, or prepare a job search.
---

# LinkedIn profile for recruiters

Goal: a profile that a recruiter for the user's target role finds in search, understands in 10 seconds and wants to contact. Specific beats impressive.

## Hard rules

- **Never invent facts.** No made-up metrics, employers, titles, tools, certifications or results. When a bullet needs a number the user didn't give, write a placeholder like `[X% de redução no MTTR]` and ask for it.
- No hype words: "top 1%", "ninja", "rockstar", "guru", "apaixonado por", "resultados excepcionais". Show it with specifics instead.
- Write in the language of the profile (default: the user's language). Keep English terms the market uses as-is (SRE, Kubernetes, SLO, FinOps).
- Respect LinkedIn limits: headline 220 characters, About 2,600 characters (first ~265 show before "ver mais"), experience description 2,000 characters.
- Don't add claims about leaving a job, layoffs or salary unless the user asks.

## Step 1: gather (ask only what's missing, in one message)

1. The current profile: headline, About, experience, skills. Pasted text, PDF export ("Salvar como PDF") or CV all work.
2. Target role(s) and seniority, e.g. "SRE Sênior / Staff, Platform Engineering".
3. Target market: country, remote/hybrid, company types or specific companies.
4. Two or three real results per recent role, with numbers if they exist (latency, availability, incidents, cost, lead time, number of teams/services, scale).

## Step 2: recruiter test (diagnosis first)

Act as a senior technical recruiter hiring for the target role (at the target company, if given). Answer honestly:
- Would you reach out? Yes / maybe / no, and why, in two sentences.
- The 5 biggest problems, ordered by impact. Typical ones: headline is only a job title; About starts with "Sou um profissional…"; experience lists duties instead of results; target keywords missing; no proof (Featured empty); a gap or title that needs context.
- What a recruiter would search for, and whether this profile appears.

Show the diagnosis before rewriting, so the user can correct wrong assumptions.

## Step 3: rewrite

**Headline (10 variations).** Formula: role + specialty + proof or domain + (optional) what you want next. Mix styles: keyword-dense for search, outcome-led, domain-led. Example shape:
`SRE Sênior | Observabilidade, Kubernetes e AWS | Plataforma de IA (LLM gateway, MCP) | Fintech`
Recommend the best one and say why.

**About (under 2,000 characters).**
- The first two lines must work alone in the preview: who you are for the target role plus the strongest proof.
- Then a short problem → approach → result arc (PAS works when it stays factual): the problem you solve for companies, how you approach it, 2–3 concrete results.
- A line with core stack/keywords, written as prose or a short list.
- A clear CTA: what you're open to and how to reach you.

**Experience (per role).** Bullets in the XYZ shape, "Accomplished X, measured by Y, by doing Z", led by a strong verb (Reduzi, Construí, Automatizei, Liderei, Migrei). 3–5 bullets per recent role, 1–2 for older ones. Placeholders where a number is missing. A one-line role summary above the bullets for context (team, scale, domain).

**Skills and keywords.** List the 25 keywords recruiters search for this role, mark each as present / missing in the profile, and say where to add the missing ones naturally (headline, About, a specific role, Skills section). Recommend the top 3 skills to pin.

**Featured (5 items).** Proof over decoration: a public repo or project, a write-up or talk, a postmortem or architecture case (sanitised), certifications only if relevant, the personal site. For each: what it should contain and why it builds credibility for the target role.

## Step 4: outreach (optional, when asked)

Three short DM templates for recruiters or hiring managers at target companies, under 300 characters for connection notes and under ~600 for InMail:
- Reference something specific about the company or role.
- One line of proof that matches it.
- A low-friction ask (a 15-minute call, or "is this team hiring for X?").
No "espero que esteja bem", no generic flattery.

## Output format

1. Diagnosis (step 2).
2. Headline options with the recommended one.
3. New About, ready to paste, with character count.
4. Experience rewrites per role, ready to paste.
5. Keyword table and where to put each missing keyword.
6. Featured plan.
7. Placeholders the user still needs to fill, as a checklist.
8. DMs, if requested.

After the user applies the changes, offer to re-run the recruiter test on the new version.
