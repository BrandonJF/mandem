# Clear Writing Style

## Scope

Apply these rules to every natural-language output in scope:

- Chat responses and status updates.
- Plans, issues, pull requests, reviews, reports, and documentation.
- Commit subjects and bodies.
- Code comments, docstrings, and file overviews.
- Script, CLI, hook, and test output.
- Logs, errors, warnings, help text, prompts, and generated prose.

Do not rewrite quoted external text. Introduce it accurately and keep the quotation distinct from
the surrounding prose.

Every rule below follows the same shape: a name, what to avoid, what to do instead. Apply each row
independently. A passage can violate more than one row at once.

## Voice and register

| Rule | Don't | Do |
|---|---|---|
| Register | Academic, legalistic, promotional, therapeutic, or theatrical phrasing. | Direct, calm, conversational phrasing, written for an intelligent generalist reader. |
| Confidence | Hedge a claim with "may," "might," "somewhat," "arguably." | State the claim, or state the condition it depends on: "if X, then Y." |
| Praise and enthusiasm | Praise a routine decision, restate agreement, or perform enthusiasm: "Great question!", "This is fantastic!" | State the fact and move on. |
| Spoken voice | A sentence you would not say aloud to a colleague. | Read it back as speech; rewrite anything that sounds stilted. |

## Literal and informational framing

| Rule | Don't | Do |
|---|---|---|
| Metaphor and personification | Metaphor, analogy, personification, aphorism, slogan, narrative hook, punchline, rhetorical question. | State the literal fact. |
| Non-agent verbs | Give a non-agent a biological or intentional verb: "the claim lives in prose," "the file wants," "the code escapes." | Name what the thing actually is or does: "the claim only appears as prose." |
| Rhetorical balance | Antithesis, a contrasting pair, or a rule-of-three list built for rhythm rather than content. | State the one fact that matters, once. |
| Engagement framing | Frame information for suspense, drama, cleverness, warmth, or engagement. | Frame it for accuracy. |
| Opening and closing | Open with a throat-clearing lead-in, or close a paragraph with a summary beat, a landing sentence, or a restatement of the point. | State the point once, where it belongs, and stop. |
| Setup and payoff | Build a paragraph as a setup followed by a payoff: "here's the thing," "what's actually happening is." | Say the thing directly. |
| Maxims | Turn a specific observation into a general maxim. | Keep the observation scoped to what it's actually about. |
| Quotation | Use a quotation as an ornamental opening or closing. | Quote only where the source's exact words are the evidence. |
| Lexicalized terms | Extend the imagery of a lexicalized technical term: "Git branch," "webhook." | Use the term for its precise technical meaning only. |

## Agency and grammatical subjects

| Rule | Don't | Do |
|---|---|---|
| Grammatical subject | Bury the actor mid-sentence, or omit it. | Make the person or process performing the action the subject. |
| Non-human agency | Give code, files, plans, issues, pull requests, checks, or phases human agency: "the plan decided," "the check wants." | Name the person or the mechanism that actually acted. |
| Guidance verbs | Say guidance "enforces," "ensures," "checks," "guarantees," or "prevents" behavior. | Say guidance instructs, and name the separate mechanism that actually enforces it. |
| Voice choice | Default to one voice regardless of what matters. | Active voice when the actor matters ("I changed the parser"); passive when the result matters ("The PR was merged"). |
| Named mechanism | "The gate decides." | "GitHub blocks the merge." |

## Verbs and nominalizations

| Rule | Don't | Do |
|---|---|---|
| Nominalization | "Grant approval," "make a decision." | "Approve," "decide." |
| Concreteness | A vague verb standing in for a specific action. | "Save," "read," "run," "reject," "merge." |
| Metaphorical verbs | Code "rides," "wrestles," "escapes," "wants," or "moves out." | Name the literal technical behavior. |
| Established terms | Replace an exact technical verb with a vaguer one. | Keep it when it's exact: "returns," "exits." |

## Sentence structure

| Rule | Don't | Do |
|---|---|---|
| Information order | Put new information before the context that explains it. | Put known context first. |
| Outcome first | Bury the outcome, decision, failure, or request. | Put it in the first sentence. |
| Subject-verb distance | Separate a subject from its verb with a long clause. | Keep them close. |
| Noun stacks | "Fresh-head approval state." | "Approval of the latest commit." |
| Parallelism scope | Carry list-style parallel syntax into paragraph prose: consecutive sentences sharing the same subject-verb shape or opening word. | Use parallel syntax only inside an actual list. Vary sentence length unpredictably in prose. |
| Parataxis | Stack short declarative clauses with no connective: "It works. It's fast. It's reliable." | Connect the clauses the way they would actually be said, or cut the redundant ones. |
| Corrective negation | "Not X, but Y" or "X, not Y." | State the true claim once. |
| Negative repetition | Repeat a negated opener (anaphora: "No taxes. No fees. No surprises.") or a negated shape (parallelism: "It doesn't do this. It doesn't do that."). | State one negative fact, if it's needed, and move on. |
| Sentence load | Pack more than one decision or more than two logical conditions into a sentence. | Split it. |

## Diction

| Rule | Don't | Do |
|---|---|---|
| Word choice | Reach for an obscure word when a common one is precise. | Use the common word unless a technical term is more exact. |
| First use | Use a project term without defining it. | Define it on first use. |
| Canonical term | Alternate synonyms for variety, or pair equivalent terms with "or." | Use the repository's one canonical term every time. |
| Hierarchy vs. classification | Let a parent or subissue relationship imply why an issue exists or what it's classified as. | Keep the two separate. |
| Internal vocabulary | Use internal state-machine or schema vocabulary in operator-facing prose. | Translate it into what the operator actually sees or does. |
| Governance shorthand | "Authority," "source of truth," "canonical." | The concrete rule or action itself. |
| Vague adjectives | "Robust," "seamless," "comprehensive," "powerful," "significant." | The specific, observable property. |
| Filler intensifiers | "Genuinely," "really," "truly," "actually." | State the claim without them. |
| Stock AI vocabulary | "Load-bearing," "surface," "gated," "belt-and-braces." | The plain description of what's actually true. |
| Corporate verbs | "Leverage," "underscore," "reflect." | "Use," "show," "state." |

## Information and length

| Rule | Don't | Do |
|---|---|---|
| Lead | Bury what changed or what the reader must do. | Lead with it. |
| Process | Narrate process that doesn't explain the result, evidence, risk, or next action. | Cut it. |
| Examples | Stack several abstract explanations. | Give one useful concrete example. |
| Repetition | Repeat a conclusion, or summarize what was just said. | Say it once. |
| Detail | Give a routine update the same length as a consequential one. | Match detail to the decision. |

## Punctuation and formatting

| Rule | Don't | Do |
|---|---|---|
| Default punctuation | Reach for an em dash by default. | Use a full stop, a comma, parentheses, or a colon; use an em dash only when it's grammatically clearer than all of those. |
| Structure | Add headings or lists that don't aid scanning. | Use them only when they do. |
| Emphasis | Bold an ordinary sentence, or decorate a status update. | Leave plain prose plain. |

## Final edit

Run this checklist against the draft, in order:

1. Identify the actor in every clause.
2. Replace avoidable nominalizations with verbs.
3. Replace vague claims with observable facts.
4. Remove metaphor, aphorism, personification, and engagement-driven framing.
5. Remove internal terminology the audience does not need.
6. Scan for the rhetorical shapes above: antithesis, corrective negation, negative parallelism,
   rule-of-three lists, paragraph-pinning sentences. They read as a performance, not a spoken
   thought.
7. Check that the first sentence gives the outcome.
8. Check that any requested action is explicit.
9. Read the prose as speech; rewrite anything you would not say to a colleague.

Source: Jesse Duffield,
[“AI-isms go deeper than em-dashes and ‘load-bearing’”](https://jesseduffield.com/AI-isms-go-deeper/).
