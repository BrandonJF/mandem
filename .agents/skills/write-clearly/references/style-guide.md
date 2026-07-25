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

## Voice and register

- Use a direct, calm, conversational register.
- Assume an intelligent reader; do not assume specialist knowledge.
- Prefer confidence supported by facts. State uncertainty plainly.
- Avoid academic, legalistic, promotional, therapeutic, or theatrical language.
- Do not praise routine decisions or restate agreement.

## Literal and informational framing

- Use literal language.
- Do not use metaphor, analogy, personification, aphorism, slogan, narrative hook, punchline, or
  rhetorical question.
- Do not frame information to create suspense, drama, cleverness, warmth, or engagement.
- Choose the frame that identifies the actor, action, evidence, consequence, and next step most
  accurately.
- Do not turn an observation into a general maxim.
- Do not use a quotation as an ornamental opening or closing.
- Retain lexicalized technical terms such as “Git branch” or “webhook” when they are the precise
  names used by the field. Do not extend their original imagery.

## Agency and grammatical subjects

- Make the grammatical subject the person or program performing the action.
- Do not assign human agency to code, files, plans, issues, pull requests, checks, or phases.
- Guidance can instruct; it does not enforce, ensure, check, guarantee, or prevent behavior.
- Use the active voice when the actor matters: “I changed the parser.”
- Use the passive voice when the action or result matters more: “The PR was merged.”
- Name the mechanism when software acts: “GitHub blocks the merge,” not “the gate decides.”

## Verbs and nominalizations

- Prefer a finite verb to a nominalization: “approve” over “grant approval”; “decide” over “make a
  decision.”
- Prefer concrete verbs: “save,” “read,” “run,” “reject,” “merge.”
- Do not use metaphorical verbs for technical behavior: code does not “ride,” “wrestle,” “escape,”
  “want,” or “move out.”
- Keep established technical verbs when they are exact: a function “returns”; a process “exits.”

## Sentence structure

- Put known context before new information.
- Put the outcome, decision, failure, or request in the first sentence.
- Keep the subject close to its verb.
- Unpack noun stacks: “approval of the latest commit,” not “fresh-head approval state.”
- Use parallel syntax in lists.
- Split sentences that contain more than one decision or more than two logical conditions.

## Diction

- Prefer common words unless a technical term is more precise.
- Define necessary project terms on first use.
- Keep internal state-machine and schema vocabulary out of operator-facing prose.
- Replace “authority,” “source of truth,” “canonical,” and similar governance shorthand with the
  concrete rule or action when writing for the operator.
- Avoid vague intensifiers and unsupported adjectives: “robust,” “seamless,” “comprehensive,”
  “powerful,” “significant.”
- Avoid stock AI vocabulary: “load-bearing,” “surface,” “gated,” “belt-and-braces.”
- Avoid “not X, but Y” unless the reader could reasonably mistake X for Y.

## Information and length

- Lead with what changed or what the reader must do.
- Include process only when it explains the result, evidence, risk, or next action.
- Prefer one useful example to several abstract explanations.
- Remove repeated conclusions, throat-clearing, and summaries of immediately preceding text.
- Match detail to the decision. Routine updates should be short.

## Punctuation and formatting

- Prefer full stops and commas.
- Use an em dash only when its grammatical function is clearer than parentheses, a colon, or a new
  sentence.
- Use headings and lists only when they improve scanning.
- Do not bold ordinary sentences or decorate status updates.

## Final edit

- Identify the actor in every clause.
- Replace avoidable nominalizations with verbs.
- Replace vague claims with observable facts.
- Remove metaphor, aphorism, personification, and engagement-driven framing.
- Remove internal terminology the audience does not need.
- Check that the first sentence gives the outcome.
- Check that any requested action is explicit.
- Read the prose as speech; rewrite anything you would not say to a colleague.

Source: Jesse Duffield,
[“AI-isms go deeper than em-dashes and ‘load-bearing’”](https://jesseduffield.com/AI-isms-go-deeper/).
